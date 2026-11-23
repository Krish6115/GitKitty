// Answers to general Git questions, kept so the next person who asks the same thing gets the answer at once instead of
// waiting in BharatCode's queue. Only a chat's first question, asked without page or tour context, is kept, under a
// fingerprint of its wording (and the answer level), so nothing ties an answer to the person who asked.
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Env } from '../env.js';
import { LruCache } from '../lib/lru.js';
import { kvFromEnv } from '../lib/redis-kv.js';
import type { TutorRequest } from './history.js';
import type { TutorSource } from './service.js';

export interface CachedAnswer {
  answer: string;
  sources: TutorSource[];
}

export interface AnswerCache {
  get(key: string): Promise<CachedAnswer | undefined>;
  set(key: string, value: CachedAnswer): Promise<void>;
}

const CachedAnswerSchema = z.object({
  answer: z.string().min(1).max(20_000),
  sources: z.array(z.object({
    n: z.number(),
    title: z.string(),
    headingPath: z.array(z.string()),
    sourceFile: z.string(),
    sourceUrl: z.string(),
    license: z.string(),
  })),
}) satisfies z.ZodType<CachedAnswer>;

/** "How do I squash commits?" and "how do i squash commits" share an answer; anything with context gets none. */
export function answerKey(req: TutorRequest, historyLength: number): string | null {
  if (historyLength > 0 || req.page || req.tour) return null;
  const wording = req.question.toLowerCase().replace(/\s+/g, ' ').trim().replace(/[\s?!.]+$/, '');
  if (wording.length < 8) return null;
  return createHash('sha256').update(`${req.level ?? 'auto'}\n${wording}`).digest('hex').slice(0, 40);
}

export function answerCacheFromEnv(env: Env, fetchImpl?: typeof fetch): AnswerCache {
  const memory = new LruCache<CachedAnswer>(500, 6 * 60 * 60_000);
  const kv = kvFromEnv(env, fetchImpl);
  const ttlSec = env.ANSWER_CACHE_TTL_DAYS * 86_400;
  const redisKey = (k: string): string => `kitty:answer:${k}`;
  return {
    async get(k) {
      const hit = memory.get(k);
      if (hit || !kv) return hit;
      const raw = await kv.get(redisKey(k));
      if (raw === undefined) return undefined;
      try {
        const parsed = CachedAnswerSchema.safeParse(JSON.parse(raw));
        if (!parsed.success) return undefined;
        memory.set(k, parsed.data);
        return parsed.data;
      } catch {
        return undefined;
      }
    },
    async set(k, value) {
      memory.set(k, value);
      await kv?.set(redisKey(k), JSON.stringify(value), ttlSec);
    },
  };
}
