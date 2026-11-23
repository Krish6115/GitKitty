import { describe, expect, it } from 'vitest';
import { KittyError } from '../src/llm/errors.js';
import { COOLDOWN_MS, withFallback } from '../src/llm/fallback.js';
import { groqEffort, selectProvider } from '../src/llm/index.js';
import { loadEnv } from '../src/env.js';
import type { ChatRequest, Provider, StreamEvent } from '../src/llm/types.js';

const req: ChatRequest = { kind: 'tutor', messages: [{ role: 'user', content: 'hi' }] };

function fake(name: 'groq' | 'bharatcode', behave: 'ok' | KittyError['code'] | 'partial'): Provider & { calls: number } {
  const p = {
    name, calls: 0,
    async *stream(): AsyncGenerator<StreamEvent> {
      p.calls++;
      if (behave === 'partial') yield { type: 'delta', text: 'half ' };
      if (behave !== 'ok') throw new KittyError(behave === 'partial' ? 'timeout' : behave, 'nope');
      yield { type: 'delta', text: `${name} answer` };
      yield { type: 'done', result: { text: `${name} answer`, finishReason: 'stop', truncated: false, usage: null, model: name } };
    },
    chat: async () => { throw new Error('unused'); },
  };
  return p;
}
const text = async (p: Provider): Promise<string> => { let t = ''; for await (const e of p.stream(req)) if (e.type === 'delta') t += e.text; return t; };

describe('Groq first, BharatCode as backup', () => {
  it('uses Groq when it answers', async () => {
    const g = fake('groq', 'ok'), b = fake('bharatcode', 'ok');
    expect(await text(withFallback(g, b, { until: 0 }))).toBe('groq answer');
    expect(b.calls).toBe(0);
  });

  it('switches to BharatCode when Groq is at its limit, and skips Groq for a while after', async () => {
    let t = 1_000;
    const cool = { until: 0 };
    const g = fake('groq', 'rate_limited'), b = fake('bharatcode', 'ok');
    expect(await text(withFallback(g, b, cool, () => t))).toBe('bharatcode answer');
    expect(await text(withFallback(g, b, cool, () => t))).toBe('bharatcode answer');
    expect(g.calls).toBe(1); // cooling down
    t += COOLDOWN_MS;
    await text(withFallback(g, b, cool, () => t));
    expect(g.calls).toBe(2);
  });

  it('switches on Groq errors and timeouts before any text', async () => {
    for (const code of ['upstream_unavailable', 'timeout', 'auth_failed'] as const) {
      expect(await text(withFallback(fake('groq', code), fake('bharatcode', 'ok'), { until: 0 }))).toBe('bharatcode answer');
    }
  });

  it('never mixes two models in one answer', async () => {
    const b = fake('bharatcode', 'ok');
    await expect(text(withFallback(fake('groq', 'partial'), b, { until: 0 }))).rejects.toMatchObject({ code: 'timeout' });
    expect(b.calls).toBe(0);
  });

  it('sends each Groq model the reasoning setting it understands', () => {
    expect(groqEffort('qwen/qwen3.8-27b', 'low')).toBe('none');
    expect(groqEffort('qwen/qwen3.8-27b', 'high')).toBe('default');
    expect(groqEffort('openai/gpt-oss-120b', 'none')).toBe('low');
    expect(groqEffort('llama-3.3-70b-versatile', 'low')).toBeUndefined();
  });

  it('only puts Groq in front when its key is set; a user key always means BharatCode', () => {
    const base = { LLM_PROVIDER: 'bharatcode', BHARATCODE_API_KEY: 'bc', GROQ_API_KEY: 'gq' };
    expect(selectProvider(loadEnv(base), undefined).provider.name).toBe('groq');
    expect(selectProvider(loadEnv({ ...base, GROQ_API_KEY: '' }), undefined).provider.name).toBe('bharatcode');
    expect(selectProvider(loadEnv(base), 'user-key').provider.name).toBe('bharatcode');
  });
});

describe('Groq errors', () => {
  it('treats "request too large" (413) like a rate limit, so BharatCode takes over', async () => {
    const { createBharatCodeProvider } = await import('../src/llm/BharatCodeProvider.js');
    const groq = createBharatCodeProvider({
      service: 'groq', baseUrl: 'https://groq.test/v1', model: 'qwen/qwen3.8-27b', apiKey: 'k', firstTokenMs: 5000, idleMs: 5000,
      fetchImpl: (async () => new Response(JSON.stringify({ error: { message: 'Request too large: tokens per minute' } }), { status: 413, headers: { 'Content-Type': 'application/json' } })) as unknown as typeof fetch,
    });
    await expect(groq.chat(req)).rejects.toMatchObject({ code: 'rate_limited', message: expect.stringMatching(/^Groq/) });
    expect(await text(withFallback(groq, fake('bharatcode', 'ok'), { until: 0 }))).toBe('bharatcode answer');
  });
});
