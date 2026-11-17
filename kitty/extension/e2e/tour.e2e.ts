// Repo tour: start from the cat menu, Next/Next/Back across file pages, browser back button, leave and resume,
// then resume again after a simulated browser restart (session storage cleared).
import { join } from 'node:path';
import { launch, log, OUT_DIR } from './launch.js';

export async function tourE2E(repo = 'Krish6115/GitKitty'): Promise<void> {
  const { ctx, sw } = await launch();
  const page = await ctx.newPage();
  const stepInfo = async (): Promise<string> => {
    await page.locator('#kitty-root [data-kitty="step"]').waitFor({ timeout: 30_000 });
    const meta = await page.locator('#kitty-root [data-kitty="step"] .meta').innerText();
    const highlighted = await page.locator('#kitty-root [data-kitty="highlight"]').count();
    const file = decodeURIComponent(new URL(page.url()).pathname.split('/').slice(5).join('/'));
    await page.waitForTimeout(2000); // let the cat finish walking
    const beside = await page.evaluate(() => {
      const root = document.getElementById('kitty-root')?.shadowRoot;
      const cat = root?.querySelector('.cat')?.getBoundingClientRect();
      const hl = root?.querySelector('[data-kitty="highlight"]')?.getBoundingClientRect();
      if (!cat || !hl) return 'n/a';
      const near = cat.left >= hl.right - 24 && cat.left - hl.right < 120 && cat.bottom > hl.top - 40 && cat.top < hl.bottom + 40;
      return near ? 'yes' : `no (cat at ${Math.round(cat.left)},${Math.round(cat.top)}; header right edge ${Math.round(hl.right)})`;
    });
    return `${meta.replace(/\n/g, ' ')} | file: ${file} | highlight: ${highlighted ? 'yes' : 'no'} | cat beside header: ${beside}`;
  };
  const click = async (label: string): Promise<void> => {
    await page.locator('#kitty-root [data-kitty="step"] button', { hasText: label }).click();
    await page.waitForLoadState('domcontentloaded');
  };

  await page.goto(`https://github.com/${repo}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root button.cat').click();
  await page.locator('#kitty-root [data-kitty="start-tour"]').click();
  const seen = new Set<string>();
  const t0 = Date.now();
  while (Date.now() - t0 < 180_000) {
    const status = await page.locator('#kitty-root .bubble').first().innerText().catch(() => '');
    if (status && !seen.has(status)) {
      seen.add(status);
      log('  progress:', status.replace(/\n/g, ' ').slice(0, 90));
    }
    if (await page.locator('#kitty-root [data-kitty="step"]').count()) break;
    if (status.includes('Try again')) throw new Error(`tour failed: ${status}`);
    await page.waitForTimeout(250);
  }
  log('start ->', await stepInfo());
  await page.screenshot({ path: join(OUT_DIR, 'tour-step1.png') });
  await click('Next');
  log('Next  ->', await stepInfo());
  await click('Next');
  log('Next  ->', await stepInfo());
  await page.screenshot({ path: join(OUT_DIR, 'tour-step3.png') });
  await click('Back');
  log('Back  ->', await stepInfo());
  await page.goBack({ waitUntil: 'domcontentloaded' });
  log('browser back ->', await stepInfo());

  await page.goto(`https://github.com/${repo}/issues`, { waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root [data-kitty="resume"]').waitFor({ timeout: 15_000 });
  log('off-tour page: resume offered');
  await page.locator('#kitty-root [data-kitty="resume"] button', { hasText: 'Resume' }).click();
  await page.waitForLoadState('domcontentloaded');
  log('Resume ->', await stepInfo());

  // browser restart: the session copy is gone, the saved copy in local storage offers "Resume tour"
  const before = await page.locator('#kitty-root [data-kitty="step"] .meta').innerText();
  await sw.evaluate(() => chrome.storage.session.clear());
  await page.goto(`https://github.com/${repo}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#kitty-root button.cat').click();
  const resumeBtn = page.locator('#kitty-root [data-kitty="resume-tour"]');
  await resumeBtn.waitFor({ timeout: 15_000 });
  log('after restart, menu offers:', await resumeBtn.innerText());
  await resumeBtn.click();
  await page.waitForLoadState('domcontentloaded');
  const after = await stepInfo();
  if (!after.startsWith(before.replace(/\n/g, ' '))) throw new Error(`resumed at a different step: ${before} -> ${after}`);
  log('Resume after restart ->', after);
  await ctx.close();
}
