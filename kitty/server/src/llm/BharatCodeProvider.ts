// OpenAI-compatible provider (BharatCode, Groq) via the openai SDK. Every call streams, so first-token / idle / total
// timeouts always apply.
import OpenAI, { APIConnectionError, APIConnectionTimeoutError, APIError, APIUserAbortError } from 'openai';
import { withRetry, type Sleep } from '../lib/retry.js';
import { CALL_BUDGETS, type StreamTimeouts } from './budgets.js';
import { KittyError, toKittyError } from './errors.js';
import type { ChatRequest, ChatResult, Provider, ReasoningEffort, StreamEvent, Usage } from './types.js';
import { recordModelWait } from './queue-meter.js';
import { createWatchdog } from './watchdog.js';

export interface BharatCodeConfig {
  baseUrl: string;
  model: string;
  apiKey: string;
  firstTokenMs: number;
  idleMs: number;
  /** Tests: inject fetch so nothing touches the network. */
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  retryDelaysMs?: number[];
  /** Tests: override the per-kind total cap. */
  totalMsOverride?: number;
  /** Which service this is (names it in errors and usage logs). Default BharatCode. */
  service?: 'bharatcode' | 'groq';
  /** How to send Kitty's reasoning effort to this model; `undefined` leaves the parameter out. Default: as is. */
  effort?: (effort: ReasoningEffort) => string | undefined;
}

/** Map SDK / network errors to typed Kitty errors. Only 503 and connection failures are retried. */
export function mapError(e: unknown, label = 'BharatCode'): KittyError {
  if (e instanceof KittyError) return e;
  if (e instanceof APIUserAbortError || e instanceof APIConnectionTimeoutError) return toKittyError(Object.assign(new Error('aborted'), { name: 'TimeoutError' }));
  if (e instanceof APIError) {
    const detail = `${e.message} ${JSON.stringify(e.error ?? '')}`;
    if (/subscription_required/i.test(detail)) {
      return new KittyError('subscription_required', `This ${label} account needs an active subscription for this model.`);
    }
    if (e.status === 503) return new KittyError('upstream_unavailable', `${label} is busy right now.`, { retryable: true, cause: e });
    // 413: the request is bigger than the per-minute token limit (Groq's free plan)
    if (e.status === 429 || e.status === 413) return new KittyError('rate_limited', `${label} rate limit reached. Please wait a moment.`);
    if (e.status === 401 || e.status === 403) return new KittyError('auth_failed', `The ${label} API key was rejected.`);
    if (e instanceof APIConnectionError) return new KittyError('upstream_unavailable', `Could not reach ${label}.`, { retryable: true, cause: e });
    const why = e.message.replace(/\s+/g, ' ').slice(0, 200);
    return new KittyError('upstream_error', `${label} error${e.status ? ` (HTTP ${e.status})` : ''}: ${why}`, { cause: e });
  }
  return toKittyError(e);
}

const toUsage = (u: OpenAI.CompletionUsage | null | undefined): Usage | null =>
  u ? { promptTokens: u.prompt_tokens, completionTokens: u.completion_tokens, totalTokens: u.total_tokens } : null;

export function createBharatCodeProvider(cfg: BharatCodeConfig): Provider {
  const service = cfg.service ?? 'bharatcode';
  const label = service === 'groq' ? 'Groq' : 'BharatCode';
  const client = new OpenAI({
    apiKey: cfg.apiKey,
    baseURL: cfg.baseUrl,
    maxRetries: 0, // our own 503 backoff applies instead
    ...(cfg.fetchImpl ? { fetch: cfg.fetchImpl } : {}),
  });

  async function* stream(req: ChatRequest): AsyncGenerator<StreamEvent> {
    const budget = CALL_BUDGETS[req.kind];
    const timeouts: StreamTimeouts = {
      firstTokenMs: Math.min(cfg.firstTokenMs, req.firstTokenMs ?? Infinity),
      idleMs: cfg.idleMs,
      totalMs: Math.min(cfg.totalMsOverride ?? budget.totalMs, req.totalMs ?? Infinity),
    };
    const wanted = req.reasoningEffort ?? budget.reasoningEffort;
    const effort = wanted && cfg.effort ? cfg.effort(wanted) : wanted;
    const startedAt = Date.now();
    const wd = createWatchdog(timeouts, req.signal);
    // With a per-request first-token limit, only real answer text counts as "started": the model also streams
    // empty and reasoning-only chunks while it is queued or thinking, which would otherwise keep the wait open.
    const ctrl = new AbortController();
    const firstText = req.firstTokenMs !== undefined
      ? setTimeout(() => {
          recordModelWait(Date.now() - startedAt);
          ctrl.abort(new KittyError('timeout', 'The model did not start answering in time.'));
        }, timeouts.firstTokenMs)
      : undefined;
    ctrl.signal.addEventListener('abort', () => wd.abortWith(ctrl.signal.reason), { once: true });
    let text = '';
    let finishReason = 'unknown';
    let usage: Usage | null = null;
    let model = cfg.model;
    try {
      const s = await withRetry(
        () =>
          client.chat.completions
            .create(
              {
                model: cfg.model,
                messages: req.messages,
                max_tokens: req.maxTokens ?? budget.maxTokens,
                stream: true,
                stream_options: { include_usage: true },
                ...(effort ? { reasoning_effort: effort as OpenAI.ReasoningEffort } : {}),
                ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
              },
              { signal: wd.signal, timeout: timeouts.totalMs },
            )
            .catch((e: unknown) => {
              throw mapError(e, label);
            }),
        { signal: wd.signal, ...(cfg.sleep ? { sleep: cfg.sleep } : {}), ...(cfg.retryDelaysMs ? { delaysMs: cfg.retryDelaysMs } : {}) },
      );
      for await (const chunk of s) {
        const choice = chunk.choices[0];
        const d = choice?.delta as { content?: string | null; reasoning_content?: string | null; reasoning?: string | null } | undefined;
        // BharatCode sends empty chunks while a request waits in its queue; only real output (answer text or reasoning)
        // ends the wait for the first words and starts the idle timer
        if (d?.content || d?.reasoning_content || d?.reasoning || choice?.finish_reason || chunk.usage) wd.activity();
        model = chunk.model || model;
        usage = toUsage(chunk.usage) ?? usage;
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        const delta = choice?.delta?.content;
        if (delta) {
          if (!text) recordModelWait(Date.now() - startedAt);
          clearTimeout(firstText);
          text += delta;
          yield { type: 'delta', text: delta };
        }
      }
      // An abort mid-stream can end the SDK iterator quietly; never return partial text as if complete.
      if (wd.signal.aborted) throw wd.signal.reason instanceof KittyError ? wd.signal.reason : mapError(wd.signal.reason, label);
    } catch (e) {
      if (wd.signal.aborted && wd.signal.reason instanceof KittyError) throw wd.signal.reason;
      throw mapError(e, label);
    } finally {
      clearTimeout(firstText);
      wd.dispose();
    }
    if (finishReason === 'length' && text.trim() === '') {
      throw new KittyError('reasoning_budget_exhausted', 'The model spent its whole output budget reasoning and produced no answer.');
    }
    // We never send tools, so tool_calls (complete or cut off) are ignored, never executed.
    const result: ChatResult = { text, finishReason, truncated: finishReason === 'length', usage, model };
    yield { type: 'done', result };
  }

  return {
    name: service,
    stream,
    async chat(req) {
      for await (const ev of stream(req)) if (ev.type === 'done') return ev.result;
      throw new KittyError('upstream_error', `${label} stream ended without a result.`);
    },
  };
}
