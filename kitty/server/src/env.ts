import { z } from 'zod';

export const EnvSchema = z.object({
  LLM_PROVIDER: z.enum(['mock', 'bharatcode']).default('mock'),
  PORT: z.coerce.number().int().positive().default(8787),
  BHARATCODE_BASE_URL: z.url().default('https://bharatcode.ai/api/model/v1'),
  BHARATCODE_MODEL: z.string().min(1).default('glm-5.3-flash'),
  BHARATCODE_API_KEY: z.string().optional(),
  // optional: Groq answers first (fast, small free limits) and BharatCode takes over when Groq can't
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.url().default('https://api.groq.com/openai/v1'),
  // a preview model on Groq; if Groq retires it, set GROQ_MODEL=llama-3.3-70b-versatile
  GROQ_MODEL: z.string().min(1).default('qwen/qwen3.8-27b'),
  GITHUB_TOKEN: z.string().optional(),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(20),
  // BharatCode's free tier can keep a request in its queue for 2-3 minutes before the first words
  LLM_FIRST_TOKEN_MS: z.coerce.number().int().positive().default(230_000),
  LLM_IDLE_MS: z.coerce.number().int().positive().default(30_000),
  TOUR_CACHE_TTL_MIN: z.coerce.number().int().positive().default(360),
  // optional shared tour cache (Upstash Redis REST); the KV_ names are what Vercel's Upstash integration sets
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  KV_REST_API_URL: z.url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  TOUR_STORE_TTL_DAYS: z.coerce.number().int().positive().default(30),
  ANSWER_CACHE_TTL_DAYS: z.coerce.number().int().positive().default(14),
  // mock model only: delay before its first words, to try out the waiting screens
  MOCK_DELAY_MS: z.coerce.number().int().min(0).max(300_000).default(0),
  TOUR_MAX_STEPS: z.coerce.number().int().min(4).max(15).default(12),
});

export type Env = z.infer<typeof EnvSchema>;

/** Parse and validate environment variables. Empty strings count as unset. */
export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ''));
  const result = EnvSchema.safeParse(cleaned);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
