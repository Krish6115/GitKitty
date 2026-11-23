// Where finished tours are kept. In memory always; also in Upstash Redis when it's configured, so tours survive
// serverless cold starts and every instance shares them. A tour is keyed by commit, so it never goes stale.
import { z } from 'zod';
import type { Env } from '../env.js';
import { TourSchema, type TourResult } from '../tour/schema.js';
import { LruCache } from './lru.js';
import { createUpstashKv, kvFromEnv, type Kv, type UpstashOptions } from './redis-kv.js';

type MaybePromise<T> = T | Promise<T>;

/** What the tour services need. `LruCache` already fits. */
export interface TourCache {
  get(key: string): MaybePromise<TourResult | undefined>;
  set(key: string, value: TourResult): MaybePromise<void>;
  /** The newest repo tour of `owner/repo` (lower case) at any commit. */
  latest?(repo: string): MaybePromise<TourResult | undefined>;
}

// a stored tour is checked like any other outside input before it's served
const StoredTourSchema = z.object({
  tour: TourSchema,
  meta: z.object({
    owner: z.string(),
    repo: z.string(),
    sha: z.string(),
    partial: z.boolean(),
    cached: z.boolean(),
    provider: z.string(),
    repaired: z.boolean(),
    droppedSteps: z.array(z.string()),
    usage: z.object({ promptTokens: z.number(), completionTokens: z.number(), totalTokens: z.number() }).nullable(),
    contextTokens: z.number(),
    unreadableFiles: z.number(),
    defaultBranch: z.string(),
    issue: z.object({ number: z.number(), title: z.string(), url: z.string(), labels: z.array(z.string()) }).optional(),
    pr: z.object({ number: z.number(), title: z.string(), url: z.string() }).optional(),
    described: z.number().optional(),
    modelFailed: z.boolean().optional(),
    createdAt: z.string().optional(),
    basedOn: z.string().optional(),
  }),
}) satisfies z.ZodType<TourResult>;

export interface RedisOptions extends UpstashOptions {
  ttlSec: number;
}

/** Tours in Upstash Redis. Anything read back is validated; failures count as cache misses. */
export function createRedisTourCache(o: RedisOptions): TourCache {
  return redisTourCache(createUpstashKv(o), o.ttlSec);
}

function redisTourCache(kv: Kv, ttlSec: number): TourCache {
  const read = async (k: string): Promise<TourResult | undefined> => {
    const raw = await kv.get(k);
    if (raw === undefined) return undefined;
    try {
      const parsed = StoredTourSchema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : undefined;
    } catch {
      return undefined;
    }
  };
  return {
    get: (k) => read(`kitty:tour:${k}`),
    async set(k, value) {
      const json = JSON.stringify(value);
      await kv.set(`kitty:tour:${k}`, json, ttlSec);
      if (isRepoTour(value)) await kv.set(`kitty:tour-latest:${repoOf(value)}`, json, ttlSec);
    },
    latest: (repo) => read(`kitty:tour-latest:${repo}`),
  };
}

const isRepoTour = (t: TourResult): boolean => !t.meta.issue && !t.meta.pr;
const repoOf = (t: TourResult): string => `${t.meta.owner}/${t.meta.repo}`.toLowerCase();

/** In memory: tours by key, plus the newest repo tour per repository. */
export function memoryTourCache(max: number, ttlMs: number): TourCache {
  const byKey = new LruCache<TourResult>(max, ttlMs);
  const newest = new LruCache<TourResult>(max, ttlMs);
  return {
    get: (k) => byKey.get(k),
    set(k, value) {
      byKey.set(k, value);
      if (isRepoTour(value)) newest.set(repoOf(value), value);
    },
    latest: (repo) => newest.get(repo),
  };
}

/** Memory first, then the shared store; a shared hit is copied into memory. */
export function layeredTourCache(memory: TourCache, shared: TourCache): TourCache {
  return {
    async get(k) {
      const hit = await memory.get(k);
      if (hit) return hit;
      const remote = await shared.get(k);
      if (remote) await memory.set(k, remote);
      return remote;
    },
    async set(k, value) {
      await memory.set(k, value);
      await shared.set(k, value);
    },
    async latest(repo) {
      return (await memory.latest?.(repo)) ?? (await shared.latest?.(repo));
    },
  };
}

/** The tour cache for this deployment: Redis-backed when it's configured, memory only otherwise. */
export function tourCacheFromEnv(env: Env, fetchImpl?: typeof fetch): TourCache {
  const memory = memoryTourCache(100, env.TOUR_CACHE_TTL_MIN * 60_000);
  const kv = kvFromEnv(env, fetchImpl);
  return kv ? layeredTourCache(memory, redisTourCache(kv, env.TOUR_STORE_TTL_DAYS * 86_400)) : memory;
}
