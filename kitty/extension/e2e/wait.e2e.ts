// Waiting screens while the model is queued. Needs a server whose mock model holds back its answer:
//   LLM_PROVIDER=mock MOCK_DELAY_MS=20000 npm run dev -w server
// After 5 s the chat shows Kitty's saved answer to the closest common question, after 15 s it explains the wait
// (and, without an own key, how to skip the shared line), and the real answer replaces both when it arrives.
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function waitE2E(): Promise<void> {
  const { ctx, extId } = await launch({ width: 420, height: 900 });
  const panel = await ctx.newPage();
  await panel.goto(`chrome-extension://${extId}/src/sidepanel/index.html`);
  await panel.getByRole('tab', { name: 'Ask Kitty' }).click();
  await panel.getByLabel('Your question').fill('How do I stash my changes including untracked files and keep the staged ones?');
  await panel.keyboard.press('Enter');

  await panel.locator('[data-kitty="related"]').waitFor({ timeout: 10_000 });
  log('after ~5 s: saved answer to a similar question shown while waiting');
  const note = panel.locator('[data-kitty="slow"]');
  await note.waitFor({ timeout: 15_000 });
  const text = await note.innerText();
  if (!/own BharatCode key/.test(text)) throw new Error(`no own-key tip in the waiting note: ${text}`);
  log('after ~15 s: queue note with the own-key tip');
  await panel.screenshot({ path: join(OUT_DIR, 'wait.png') });

  await panel.locator('.msg.kitty[data-status="done"]').waitFor({ timeout: 60_000 });
  if (await panel.locator('[data-kitty="related"]').count()) throw new Error('the saved answer stayed after the real answer arrived');
  log('real answer arrived and replaced the waiting screen');
  await ctx.close();
}
