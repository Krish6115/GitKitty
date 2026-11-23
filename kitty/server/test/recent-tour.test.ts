import { describe, expect, it } from 'vitest';
import { memoryTourCache } from '../src/lib/tour-store.js';
import { createMockProvider } from '../src/llm/mock.js';
import type { ChatRequest, Provider } from '../src/llm/types.js';
import type { TourResult } from '../src/tour/schema.js';
import { getTour, RECENT_TOUR_DAYS } from '../src/tour/service.js';
import { fakeGitHub, fixtureRepo } from './fixtures/repo.js';

/** The mock model, counting how often it's asked. */
function counted(): Provider & { calls: number } {
  const mock = createMockProvider();
  const p = { ...mock, calls: 0, stream(req: ChatRequest) { p.calls++; return mock.stream(req); } };
  return p;
}

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);

async function tourAt(sha: string, cache = memoryTourCache(10, 60_000), files?: Record<string, string>) {
  const fx = fixtureRepo({ sha, ...(files ? { files } : {}) });
  const provider = counted();
  const result = await getTour({ github: fakeGitHub(fx), provider, cache, maxSteps: 10 }, { owner: fx.owner, repo: fx.repo });
  return { result, provider, cache, fx };
}

describe('reusing a recent tour for a newer commit', () => {
  it('serves the earlier tour when every file it visits still exists', async () => {
    const first = await tourAt(SHA_A);
    expect(first.result.meta.createdAt).toBeTruthy();
    const second = await tourAt(SHA_B, first.cache);
    expect(second.provider.calls).toBe(0);
    expect(second.result.meta).toMatchObject({ sha: SHA_B, cached: true, basedOn: SHA_A });
    expect(second.result.tour.steps).toEqual(first.result.tour.steps);
  });

  it('builds a new tour when a file from the earlier tour is gone', async () => {
    const first = await tourAt(SHA_A);
    const gone = first.result.tour.steps[0]?.path ?? '';
    const files = { ...first.fx.files };
    delete files[gone];
    const second = await tourAt(SHA_B, first.cache, files);
    expect(second.provider.calls).toBeGreaterThan(0);
    expect(second.result.meta.basedOn).toBeUndefined();
  });

  it(`does not reuse tours older than ${RECENT_TOUR_DAYS} days`, async () => {
    const first = await tourAt(SHA_A);
    const old: TourResult = { ...first.result, meta: { ...first.result.meta, createdAt: new Date(Date.now() - (RECENT_TOUR_DAYS + 1) * 86_400_000).toISOString() } };
    const cache = memoryTourCache(10, 60_000);
    await cache.set(`acme/todo-api@${SHA_A}`, old);
    const second = await tourAt(SHA_B, cache);
    expect(second.provider.calls).toBeGreaterThan(0);
  });

  it('never reuses a tour for an issue walkthrough', async () => {
    const first = await tourAt(SHA_A);
    const fx = fixtureRepo({ sha: SHA_B, issues: [{ number: 7, title: 'Fix the login bug', body: 'login fails', html_url: 'https://github.com/acme/todo-api/issues/7', state: 'open', comments: 0, created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z', labels: [], assignees: [] }] });
    const provider = counted();
    const r = await getTour({ github: fakeGitHub(fx), provider, cache: first.cache, maxSteps: 10 }, { owner: fx.owner, repo: fx.repo, issue: 7 });
    expect(r.meta.basedOn).toBeUndefined();
    expect(provider.calls).toBeGreaterThan(0);
  });
});
