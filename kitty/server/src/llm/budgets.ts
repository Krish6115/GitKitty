// Per-feature output caps, reasoning effort and time limits. The totals leave room for BharatCode's queue (up to
// ~3 minutes on the free tier, measured 2026-11-22) and stay under Vercel's 300 s function limit.
import type { ReasoningEffort, TaskKind } from './types.js';

export interface CallBudget {
  /** Output cap; on BharatCode this includes reasoning tokens. */
  maxTokens: number;
  /** `undefined` = don't send the parameter (model default). */
  reasoningEffort: ReasoningEffort | undefined;
  /** Hard cap for the whole call, retries included. */
  totalMs: number;
}

export const CALL_BUDGETS: Record<TaskKind, CallBudget> = {
  // low effort: at the default the model spent ~150s reasoning before writing a vite tour (live check 2026-11-03)
  tour: { maxTokens: 10_000, reasoningEffort: 'low', totalMs: 285_000 },
  // low effort: first text ~4s vs 7-11s at default, similar tokens (live check 2026-11-02)
  tutor: { maxTokens: 6_000, reasoningEffort: 'low', totalMs: 285_000 },
  explain: { maxTokens: 1_500, reasoningEffort: 'none', totalMs: 280_000 },
};

export interface StreamTimeouts {
  /** Max wait for the first streamed chunk (free-tier queueing happens here). */
  firstTokenMs: number;
  /** Max silence between chunks once streaming has started. */
  idleMs: number;
  totalMs: number;
}
