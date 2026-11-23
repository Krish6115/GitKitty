// A tiny string key-value store on Upstash Redis, over its REST API (no client library). Every failure counts as a
// miss or a skipped write, so Redis being slow or down never breaks a request.
import type { Env } from '../env.js';

export interface Kv {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
}

export interface UpstashOptions {
  url: string;
  token: string;
  fetchImpl?: typeof fetch;
  /** Called on each failure. Never receives the token. */
  onError?: (message: string) => void;
}

export function createUpstashKv(o: UpstashOptions): Kv {
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
  const fail = (what: string, e: unknown): void => o.onError?.(`redis ${what} failed: ${e instanceof Error ? e.message : String(e)}`);
  return {
    async get(key) {
      try {
        const raw = await run(['GET', key]);
        return typeof raw === 'string' ? raw : undefined;
      } catch (e) {
        fail('read', e);
        return undefined;
      }
    },
    async set(key, value, ttlSec) {
      try {
        await run(['SET', key, value, 'EX', ttlSec]);
      } catch (e) {
        fail('write', e);
      }
    },
  };
}

/** Redis for this deployment when its REST URL and token are set (the KV_ names are what Vercel's Upstash integration sets). */
export function kvFromEnv(env: Env, fetchImpl?: typeof fetch): Kv | null {
  const url = env.UPSTASH_REDIS_REST_URL ?? env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN ?? env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return createUpstashKv({
    url,
    token,
    ...(fetchImpl ? { fetchImpl } : {}),
    onError: (message) => console.warn(JSON.stringify({ event: 'cache_error', message })),
  });
}
