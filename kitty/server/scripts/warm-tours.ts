// Tours popular repositories through the public Kitty server, one at a time, so their tours are cached before anyone
// asks. The server keeps each tour in Redis; a repo whose tour is already cached (or whose recent tour still fits its
// files) costs nothing. Run weekly by .github/workflows/warm-tours.yml.
// Usage: npm run warm-tours -w server [-- --server=https://kitty-server.vercel.app] [--repos=owner/name,...]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const server = (process.argv.find((a) => a.startsWith('--server='))?.slice(9) ?? 'https://kitty-server.vercel.app').replace(/\/+$/, '');
// --repos=owner/name,owner/name overrides the list (for trying it out)
const picked = process.argv.find((a) => a.startsWith('--repos='))?.slice(8).split(',');
const repos = z
  .array(z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/))
  .parse(picked ?? JSON.parse(readFileSync(fileURLToPath(new URL('./popular-repos.json', import.meta.url)), 'utf8')));

const Result = z.object({
  tour: z.object({ steps: z.array(z.unknown()) }),
  meta: z.object({ cached: z.boolean(), basedOn: z.string().optional(), modelFailed: z.boolean().optional(), described: z.number().optional() }),
});

/** The result or error event at the end of a /tour SSE stream. */
function lastEvent(body: string): { event: string; data: unknown } | null {
  for (const block of body.trim().split(/\n\n/).reverse()) {
    const event = /^event: (.*)$/m.exec(block)?.[1];
    if (event !== 'result' && event !== 'error') continue;
    const data = block.split('\n').filter((l) => l.startsWith('data: ')).map((l) => l.slice(6)).join('\n');
    return { event, data: JSON.parse(data) };
  }
  return null;
}

let toured = 0;
for (const full of repos) {
  const [owner, repo] = full.split('/');
  const t0 = Date.now();
  const took = (): string => `${Math.round((Date.now() - t0) / 1000)}s`;
  try {
    const res = await fetch(`${server}/tour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, repo }),
      signal: AbortSignal.timeout(300_000),
    });
    const end = lastEvent(await res.text());
    const result = end?.event === 'result' ? Result.safeParse(end.data) : null;
    if (!result?.success) {
      console.log(`${full}: no tour (${res.status} ${JSON.stringify(end?.data ?? null).slice(0, 160)}) after ${took()}`);
      continue;
    }
    const m = result.data.meta;
    // the server only keeps tours the model explained in full
    const complete = !m.modelFailed && (m.described === undefined || m.described === result.data.tour.steps.length);
    const how = m.cached ? (m.basedOn ? 'already cached (recent tour still fits)' : 'already cached') : complete ? 'toured and cached' : "built partly from Kitty's own notes (not cached)";
    if (!m.cached && complete) toured++;
    console.log(`${full}: ${how} in ${took()}`);
  } catch (e) {
    console.log(`${full}: failed after ${took()} (${e instanceof Error ? e.message : String(e)})`);
  }
}
console.log(`\n${toured} new tours cached, ${repos.length} repos checked`);
