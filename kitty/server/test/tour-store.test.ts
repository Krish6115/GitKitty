import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';
import { LruCache } from '../src/lib/lru.js';
import { createRedisTourCache, layeredTourCache, tourCacheFromEnv } from '../src/lib/tour-store.js';
import type { TourResult } from '../src/tour/schema.js';

const tour: TourResult = {
  tour: {
    summary: 'A todo API.',
    stack: ['Node.js'],
    steps: [{ path: 'src/index.js', title: 'Entry point', what: 'Starts the server.', why_it_matters: 'Everything begins here.' }],
    how_to_run: 'npm start',
    how_to_contribute: 'Open a PR.',
    good_first_issue_tips: [],
  },
  meta: {
    owner: 'acme', repo: 'todo-api', sha: 'a'.repeat(40), partial: false, cached: false, provider: 'mock', repaired: false,
    droppedSteps: [], usage: null, contextTokens: 100, unreadableFiles: 0, defaultBranch: 'main',
  },
};

/** A tiny stand-in for Upstash's REST API: POST a JSON command array, get {"result": ...}. */
function fakeUpstash(opts: { fail?: boolean } = {}) {
  const data = new Map<string, string>();
  const calls: { auth: string | null; command: unknown[] }[] = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as unknown[];
    calls.push({ auth: new Headers(init?.headers).get('authorization'), command });
    if (opts.fail) return new Response('{"error":"down"}', { status: 500 });
    const [op, key, value] = command as [string, string, string];
    if (op === 'SET') {
      data.set(key, value);
      return new Response('{"result":"OK"}');
    }
    return new Response(JSON.stringify({ result: data.get(key) ?? null }));
  }) as typeof fetch;
  return { data, calls, fetchImpl };
}

describe('tour store', () => {
  it('saves and reads tours from Redis with an expiry and the token', async () => {
    const up = fakeUpstash();
    const cache = createRedisTourCache({ url: 'https://redis.example', token: 't0k', ttlSec: 60, fetchImpl: up.fetchImpl });
    await cache.set('acme/todo-api@aaa', tour);
    expect(up.calls[0]?.command).toEqual(['SET', 'kitty:tour:acme/todo-api@aaa', JSON.stringify(tour), 'EX', 60]);
    expect(up.calls[0]?.auth).toBe('Bearer t0k');
    expect(await cache.get('acme/todo-api@aaa')).toEqual(tour);
    expect(await cache.get('acme/other@bbb')).toBeUndefined();
  });

  it('ignores stored data that is not a valid tour', async () => {
    const up = fakeUpstash();
    up.data.set('kitty:tour:bad', '{"tour":{"summary":1}}');
    up.data.set('kitty:tour:junk', 'not json');
    const cache = createRedisTourCache({ url: 'https://redis.example', token: 't', ttlSec: 60, fetchImpl: up.fetchImpl });
    expect(await cache.get('bad')).toBeUndefined();
    expect(await cache.get('junk')).toBeUndefined();
  });

  it('treats Redis failures as misses and never throws', async () => {
    const errors: string[] = [];
    const cache = createRedisTourCache({ url: 'https://redis.example', token: 'secret', ttlSec: 60, fetchImpl: fakeUpstash({ fail: true }).fetchImpl, onError: (m) => errors.push(m) });
    await expect(cache.set('k', tour)).resolves.toBeUndefined();
    expect(await cache.get('k')).toBeUndefined();
    expect(errors).toHaveLength(3); // the tour, the repo's newest-tour entry, and the read
    expect(errors.join(' ')).not.toContain('secret');
  });

  it('serves from memory first and copies shared hits into memory', async () => {
    const up = fakeUpstash();
    const shared = createRedisTourCache({ url: 'https://redis.example', token: 't', ttlSec: 60, fetchImpl: up.fetchImpl });
    await shared.set('k', tour);
    const memory = new LruCache<TourResult>(10, 60_000);
    const cache = layeredTourCache(memory, shared);
    expect(await cache.get('k')).toEqual(tour); // from Redis, e.g. after a cold start
    expect(memory.get('k')).toEqual(tour);
    const before = up.calls.length;
    await cache.get('k');
    expect(up.calls.length).toBe(before); // second read never left the instance
  });

  it('uses Redis only when both the URL and token are configured', async () => {
    const up = fakeUpstash();
    const memoryOnly = tourCacheFromEnv(loadEnv({}), up.fetchImpl);
    await memoryOnly.set('k', tour);
    expect(up.calls).toHaveLength(0);

    const vercel = tourCacheFromEnv(loadEnv({ KV_REST_API_URL: 'https://redis.example', KV_REST_API_TOKEN: 't' }), up.fetchImpl);
    await vercel.set('k', tour);
    expect(up.calls.map((c) => c.command[1])).toEqual(['kitty:tour:k', 'kitty:tour-latest:acme/todo-api']);
    expect(up.calls[0]?.command[4]).toBe(30 * 86_400);
  });
});
