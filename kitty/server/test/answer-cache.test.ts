import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';
import type { RetrievedChunk } from '../src/rag/retrieve.js';
import { answerCacheFromEnv, answerKey } from '../src/tutor/answer-cache.js';
import { createFaqMatcher, type FaqEntry } from '../src/tutor/faq.js';
import { streamTutor } from '../src/tutor/service.js';
import { collect, scripted } from './fixtures/provider.js';

const chunk = (n: number, text: string, score = 200): RetrievedChunk => ({
  id: `src${n}#0`, text, title: `Title ${n}`, headingPath: [`Section ${n}`], sourceFile: `Git/references/f${n}.md`,
  sourceUrl: `https://example.com/${n}`, license: 'CC BY 4.0', score,
});
const SOURCES = [chunk(1, 'Use git bisect start, git bisect bad and git bisect good to find the commit.')];
const ask = (question: string, extra: Record<string, unknown> = {}) => ({ question, history: [], ...extra });

function fakeUpstash() {
  const data = new Map<string, string>();
  const calls: unknown[][] = [];
  const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as unknown[];
    calls.push(command);
    const [op, key, value] = command as [string, string, string];
    if (op === 'SET') data.set(key, value);
    return new Response(JSON.stringify({ result: op === 'SET' ? 'OK' : (data.get(key) ?? null) }));
  }) as typeof fetch;
  return { data, calls, fetchImpl };
}

describe('answer cache keys', () => {
  it('matches the same wording regardless of case, spacing and the question mark', () => {
    expect(answerKey(ask('How do I find a bad commit?'), 0)).toBe(answerKey(ask('  how do i  find a bad commit '), 0));
  });

  it('keeps answer levels apart and never caches questions with context', () => {
    expect(answerKey(ask('How do I find a bad commit?', { level: 'advanced' }), 0)).not.toBe(answerKey(ask('How do I find a bad commit?'), 0));
    expect(answerKey(ask('How do I find a bad commit?'), 2)).toBeNull();
    expect(answerKey(ask('What does this file do?', { page: { url: 'https://github.com/a/b', title: 'b', pageType: 'repo', text: '' } }), 0)).toBeNull();
    expect(answerKey(ask('Explain this step', { tour: { repo: 'a/b', summary: '', stepNumber: 1, totalSteps: 2, step: { path: 'x', title: 'x', what: 'x', why_it_matters: 'x' } } }), 0)).toBeNull();
  });
});

describe('answering repeated questions from the cache', () => {
  it('asks the model once, then answers the same question instantly', async () => {
    const provider = scripted('Use `git bisect` to find it [1].');
    const answers = answerCacheFromEnv(loadEnv({}));
    const deps = { provider, retrieve: () => SOURCES, answers };
    const first = await collect(streamTutor(deps, ask('How do I find which commit broke the build?')));
    expect(first.at(-1)).toMatchObject({ type: 'done' });
    expect(first.at(-1)).not.toMatchObject({ instant: true });
    const second = await collect(streamTutor(deps, ask('how do i find which commit broke the build')));
    expect(provider.reqs).toHaveLength(1);
    expect(second).toEqual([
      { type: 'sources', weak: false, sources: [expect.objectContaining({ n: 1, title: 'Title 1' })] },
      { type: 'delta', text: 'Use `git bisect` to find it [1].' },
      expect.objectContaining({ type: 'done', instant: true }),
    ]);
  });

  it('does not keep answers that were cut off, asked to act, or had weak sources', async () => {
    const answers = answerCacheFromEnv(loadEnv({}));
    const action = scripted('Here you go.\nACTION: {"type":"find_issues","query":"docker"}');
    await collect(streamTutor({ provider: action, retrieve: () => SOURCES, answers }, ask('Find me a good first issue about docker')));
    await collect(streamTutor({ provider: action, retrieve: () => SOURCES, answers }, ask('Find me a good first issue about docker')));
    expect(action.reqs).toHaveLength(2);

    const weak = scripted('Not sure, see the git docs.');
    await collect(streamTutor({ provider: weak, retrieve: () => [chunk(1, 'unrelated', 1)], answers }, ask('How do I configure a frobnicator?')));
    await collect(streamTutor({ provider: weak, retrieve: () => [chunk(1, 'unrelated', 1)], answers }, ask('How do I configure a frobnicator?')));
    expect(weak.reqs).toHaveLength(2);
  });

  it('shares answers through Redis, so a new server instance can serve them', async () => {
    const up = fakeUpstash();
    const env = loadEnv({ KV_REST_API_URL: 'https://redis.example', KV_REST_API_TOKEN: 't' });
    const provider = scripted('Use `git bisect` [1].');
    await collect(streamTutor({ provider, retrieve: () => SOURCES, answers: answerCacheFromEnv(env, up.fetchImpl) }, ask('How do I find which commit broke the build?')));
    const write = up.calls.find((c) => c[0] === 'SET');
    expect(String(write?.[1])).toMatch(/^kitty:answer:[0-9a-f]{40}$/);
    expect(write?.[4]).toBe(14 * 86_400);

    const fresh = answerCacheFromEnv(env, up.fetchImpl); // cold start: empty memory
    const evs = await collect(streamTutor({ provider, retrieve: () => SOURCES, answers: fresh }, ask('How do I find which commit broke the build?')));
    expect(provider.reqs).toHaveLength(1);
    expect(evs.at(-1)).toMatchObject({ type: 'done', instant: true });
  });

  it('ignores stored data that is not a valid answer', async () => {
    const up = fakeUpstash();
    const env = loadEnv({ KV_REST_API_URL: 'https://redis.example', KV_REST_API_TOKEN: 't' });
    const cache = answerCacheFromEnv(env, up.fetchImpl);
    const key = answerKey(ask('How do I find which commit broke the build?'), 0) ?? '';
    up.data.set(`kitty:answer:${key}`, '{"answer":""}');
    expect(await cache.get(key)).toBeUndefined();
  });
});

describe('while the model is queued', () => {
  const entry = (id: string, questions: string[]): FaqEntry => ({
    id, questions, answer: `Saved answer for ${id} [1].`,
    sources: [{ n: 1, title: 'Pro Git', headingPath: ['Stash'], sourceFile: 'Git/references/stash.md', sourceUrl: 'https://git-scm.com/book', license: 'CC BY-NC-SA 3.0' }],
  });
  const faq = createFaqMatcher([entry('stash', ['How do I stash my changes?', 'save my work temporarily without committing'])]);

  it('sends the closest saved answer before the model starts', async () => {
    const evs = await collect(streamTutor({ provider: scripted('Model answer [1].'), retrieve: () => SOURCES, faq }, ask('How do I stash my changes including untracked files and keep the index?')));
    const related = evs.findIndex((e) => e.type === 'related');
    const firstDelta = evs.findIndex((e) => e.type === 'delta');
    expect(related).toBeGreaterThan(-1);
    expect(related).toBeLessThan(firstDelta);
    expect(evs[related]).toMatchObject({ question: 'How do I stash my changes?', answer: 'Saved answer for stash [1].' });
  });
});
