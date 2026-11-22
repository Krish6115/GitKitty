// Where finished tours are kept. In memory always; also in Upstash Redis when it's configured, so tours survive
// serverless cold starts and every instance shares them. A tour is keyed by commit, so it never goes stale.
import { z } from 'zod';
import type { Env } from '../env.js';
import { TourSchema, type TourResult } from '../tour/schema.js';
import { LruCache } from './lru.js';

type MaybePromise<T> = T | Promise<T>;

/** What the tour services need. `LruCache` already fits. */
export interface TourCache {
  get(key: string): MaybePromise<TourResult | undefined>;
  set(key: string, value: TourResult): MaybePromise<void>;
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
  }),
}) satisfies z.ZodType<TourResult>;

export interface RedisOptions {
  url: string;
  token: string;
  ttlSec: number;
  fetchImpl?: typeof fetch;
  /** Called once per failure; the cache then acts as a miss. Never receives the token. */
  onError?: (message: string) => void;
}

/** Upstash Redis over its REST API (no client library). Failures count as cache misses. */
export function createRedisTourCache(o: RedisOptions): TourCache {
  const doFetch = o.fetchImpl ?? fetch;
  const run = async (command: (string | number)[]): Promise<unknown> => {
    const res = await doFetch(o.url.replace(/\/+$/, ''), {
      method: 'POST',
      headers: { Authorization: `Bearer ${o.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) throw new Error(`Redis responded ${res.status}`);
    return ((await res.json()) as { result?: unknown }).result;
  };
  const key = (k: string): string => `kitty:tour:${k}`;
  return {
    async get(k) {
      try {
        const raw = await run(['GET', key(k)]);
        if (typeof raw !== 'string') return undefined;
        const parsed = StoredTourSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : undefined;
      } catch (e) {
        o.onError?.(`tour cache read failed: ${e instanceof Error ? e.message : String(e)}`);
        return undefined;
      }
    },
    async set(k, value) {
      try {
        await run(['SET', key(k), JSON.stringify(value), 'EX', o.ttlSec]);
      } catch (e) {
        o.onError?.(`tour cache write failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
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
  };
}

/** The tour cache for this deployment: Redis-backed when its REST URL and token are set, memory only otherwise. */
export function tourCacheFromEnv(env: Env, fetchImpl?: typeof fetch): TourCache {
  const memory = new LruCache<TourResult>(100, env.TOUR_CACHE_TTL_MIN * 60_000);
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) return memory;
  const redis = createRedisTourCache({
    url,
    token,
    ttlSec: env.TOUR_STORE_TTL_DAYS * 86_400,
    ...(fetchImpl ? { fetchImpl } : {}),
    onError: (message) => console.warn(JSON.stringify({ event: 'tour_cache_error', message })),
  });
  return layeredTourCache(memory, redis);
}
