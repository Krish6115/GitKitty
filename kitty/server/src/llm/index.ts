// Picks the provider for a request and wraps it with usage logging.
import type { Env } from '../env.js';
import { consoleUsageLogger, usageEntry, type UsageLogger } from '../lib/usage-log.js';
import { createBharatCodeProvider } from './BharatCodeProvider.js';
import { KittyError } from './errors.js';
import { withFallback } from './fallback.js';
import { createMockProvider } from './mock.js';
import type { Provider, ReasoningEffort, StreamEvent } from './types.js';

export interface ProviderDeps {
  fetchImpl?: typeof fetch;
  logger?: UsageLogger;
}

/**
 * A user-supplied key (X-Kitty-Key) always means BharatCode with that key.
 * Otherwise LLM_PROVIDER decides; "bharatcode" without a server key is a setup error the UI can explain.
 * With GROQ_API_KEY set, the server's requests go to Groq first and to BharatCode when Groq can't answer.
 */
export function selectProvider(env: Env, userKey: string | undefined, deps: ProviderDeps = {}): { provider: Provider; byok: boolean } {
  const key = userKey?.trim();
  const make = (apiKey: string): Provider =>
    createBharatCodeProvider({
      baseUrl: env.BHARATCODE_BASE_URL,
      model: env.BHARATCODE_MODEL,
      apiKey,
      firstTokenMs: env.LLM_FIRST_TOKEN_MS,
      idleMs: env.LLM_IDLE_MS,
      ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
    });
  let provider: Provider;
  if (key) provider = make(key);
  else if (env.LLM_PROVIDER === 'mock') provider = createMockProvider(env.MOCK_DELAY_MS);
  else if (env.BHARATCODE_API_KEY) provider = env.GROQ_API_KEY ? withFallback(groq(env, env.GROQ_API_KEY, deps), make(env.BHARATCODE_API_KEY)) : make(env.BHARATCODE_API_KEY);
  else throw new KittyError('key_required', 'This Kitty server has no BharatCode key. Add your own key in Kitty settings.');
  return { provider: withUsageLogging(provider, deps.logger ?? consoleUsageLogger), byok: Boolean(key) };
}

/** Groq: fast, but small free limits, so it gives up quickly and BharatCode takes over. */
function groq(env: Env, apiKey: string, deps: ProviderDeps): Provider {
  return createBharatCodeProvider({
    service: 'groq',
    baseUrl: env.GROQ_BASE_URL,
    model: env.GROQ_MODEL,
    apiKey,
    firstTokenMs: 15_000,
    idleMs: env.LLM_IDLE_MS,
    effort: (e) => groqEffort(env.GROQ_MODEL, e),
    ...(deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {}),
  });
}

/** Groq's models take different reasoning settings: Qwen "none"/"default", gpt-oss low/medium/high, Llama none at all. */
export function groqEffort(model: string, effort: ReasoningEffort): string | undefined {
  if (/qwen/i.test(model)) return effort === 'none' || effort === 'low' ? 'none' : 'default';
  if (/gpt-oss/i.test(model)) return effort === 'none' ? 'low' : effort;
  return undefined;
}

export function withUsageLogging(p: Provider, log: UsageLogger): Provider {
  return {
    name: p.name,
    async chat(req) {
      const t0 = performance.now();
      const result = await p.chat(req);
      log(usageEntry(req.kind, p.name, result, performance.now() - t0));
      return result;
    },
    async *stream(req): AsyncGenerator<StreamEvent> {
      const t0 = performance.now();
      for await (const ev of p.stream(req)) {
        if (ev.type === 'done') log(usageEntry(req.kind, p.name, ev.result, performance.now() - t0));
        yield ev;
      }
    },
  };
}
