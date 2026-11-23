// Groq first, BharatCode when Groq can't answer. Groq is fast but its free plan allows few tokens per minute and per
// day; BharatCode has a big daily budget but queues requests for minutes. A request moves to the backup only if the
// first service failed before writing any text, so an answer is never mixed from two models.
import { KittyError } from './errors.js';
import type { Provider, StreamEvent } from './types.js';

const SWITCH_ON = new Set(['rate_limited', 'upstream_unavailable', 'upstream_error', 'timeout', 'auth_failed', 'subscription_required']);

/** After Groq says its limit is reached, skip it for this long instead of asking again each time. */
export const COOLDOWN_MS = 60_000;

/** Shared by every request on this server instance (providers are created per request). */
export interface Cooldown { until: number }
const instanceCooldown: Cooldown = { until: 0 };

export function withFallback(primary: Provider, backup: Provider, cooldown: Cooldown = instanceCooldown, now: () => number = Date.now): Provider {
  async function* stream(req: Parameters<Provider['stream']>[0]): AsyncGenerator<StreamEvent> {
    if (now() >= cooldown.until) {
      let wrote = false;
      try {
        for await (const ev of primary.stream(req)) {
          if (ev.type === 'delta') wrote = true;
          yield ev;
        }
        return;
      } catch (e) {
        const code = e instanceof KittyError ? e.code : 'upstream_error';
        if (wrote || req.signal?.aborted || !SWITCH_ON.has(code)) throw e;
        if (code === 'rate_limited') cooldown.until = now() + COOLDOWN_MS;
      }
    }
    yield* backup.stream(req);
  }
  return {
    name: primary.name,
    stream,
    async chat(req) {
      for await (const ev of stream(req)) if (ev.type === 'done') return ev.result;
      throw new KittyError('upstream_error', 'The model stream ended without a result.');
    },
  };
}
