// End-to-end drive of the tap-driven cockpit: tap a complaint → the leading
// diagnosis appears automatically → tap a yes/no feature → confidence updates
// live. Proves the "lowest-level input → highest-level output" loop with NO
// typing. Captures screenshots at each stage.
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = playwright;

const out = resolve(process.argv[2] || 'docs/clinical-build/eval/m-ui2/drive');
mkdirSync(out, { recursive: true });
const base = 'http://localhost:3000';
const key = 'MEDAI-INTERN-DEV';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1600 }, deviceScaleFactor: 2 });
await ctx.addInitScript(k => {
  localStorage.setItem('medai_tools_key', k);
  localStorage.setItem('medai_theme', 'light');
}, key);
const page = await ctx.newPage();
const log = (...a) => console.log(...a);
const shot = async n => { await page.screenshot({ path: resolve(out, `${n}.png`) }); log('  shot', n); };

try {
  await page.goto(`${base}/tools`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  // Enter Medicine
  await page.getByText('General Medicine', { exact: false }).first().click({ timeout: 8000 });
  await page.waitForTimeout(1500);
  await shot('01-cockpit-start');

  // START: tap the "Chest pain" complaint chip (zero typing)
  await page.getByText('Chest pain', { exact: false }).first().click({ timeout: 8000 });
  log('  tapped Chest pain');
  await page.waitForTimeout(1200);
  await shot('02-complaint-tapped');

  // CONFIRM should auto-fire. Wait for a differential / confidence % to appear.
  let diagnosed = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(1500);
    const body = await page.locator('body').innerText();
    if (/%/.test(body) && /(coronary|ACS|angina|dissection|differential|working picture)/i.test(body)) { diagnosed = true; break; }
  }
  log('  leading diagnosis appeared:', diagnosed);
  await shot('03-diagnosis-auto');

  // Grab the first confidence % shown (the hero)
  const pctBefore = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d{1,3})%/);
    return m ? parseInt(m[1], 10) : null;
  });
  log('  hero confidence before tap:', pctBefore);

  // CONFIRM: tap a "Yes" on the first discriminating feature (zero typing)
  const yes = page.getByRole('button', { name: /^yes$/i }).first();
  if (await yes.count()) {
    await yes.click({ timeout: 6000 });
    log('  tapped Yes on a discriminating feature');
    await page.waitForTimeout(4500); // allow debounce + regenerate
    await shot('04-after-feature-tap');
  } else {
    log('  (no Yes/No feature pill found — MCQ-only or stream empty)');
  }
  const pctAfter = await page.evaluate(() => {
    const m = document.body.innerText.match(/(\d{1,3})%/);
    return m ? parseInt(m[1], 10) : null;
  });
  log('  hero confidence after tap:', pctAfter);
  await shot('05-final');

  log(`\nRESULT: diagnosis=${diagnosed} before=${pctBefore}% after=${pctAfter}%`);
} catch (e) {
  log('DRIVE ERROR:', e.message);
  await shot('99-error');
} finally {
  await browser.close();
}
