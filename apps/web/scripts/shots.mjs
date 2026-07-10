// Reusable UI screenshot harness for the M-UI/2 frontend overhaul.
//
// Captures every major MedAI surface at desktop + phone widths, in light and
// dark, against the LIVE beta-server (which serves the built web app at
// /tools). Seeds localStorage to bypass the access gate and to force the
// theme, so no manual clicking is needed for the entry surfaces; drives the
// SPA with clicks for the deeper surfaces (department → clerk).
//
// Usage:
//   node apps/web/scripts/shots.mjs [outDir] [baseUrl] [accessKey]
// Defaults: outDir=docs/clinical-build/eval/m-ui2/current  baseUrl=http://localhost:3000  key=MEDAI-INTERN-DEV
//
// Requires the globally-installed playwright (1.56) + the pre-provisioned
// Chromium under PLAYWRIGHT_BROWSERS_PATH. Do NOT `playwright install`.

import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { mkdirSync } from 'node:fs';
const { chromium } = playwright;
import { resolve } from 'node:path';

const outDir = resolve(process.argv[2] || 'docs/clinical-build/eval/m-ui2/current');
const base = (process.argv[3] || 'http://localhost:3000').replace(/\/$/, '');
const key = process.argv[4] || 'MEDAI-INTERN-DEV';
const toolsUrl = `${base}/tools`;

mkdirSync(outDir, { recursive: true });

const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 }; // iPhone 12/13/14 logical size

// Seed gate key + theme into localStorage before the app's first paint.
function seed(theme) {
  return `(() => {
    try {
      localStorage.setItem('medai_tools_key', ${JSON.stringify(key)});
      localStorage.setItem('medai_theme', ${JSON.stringify(theme)});
    } catch (e) {}
  })()`;
}

async function settle(page, ms = 900) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

async function shoot(page, name) {
  const file = resolve(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log('  •', name);
}

// A surface = a function that navigates/interacts to the target state, then
// returns the screenshot base name. Kept deliberately resilient: a click that
// misses (selector text drifted) logs and continues rather than aborting the
// whole run, so a partial UI change still yields a partial baseline.
async function clickText(page, text, timeout = 4000) {
  const loc = page.getByText(text, { exact: false }).first();
  await loc.click({ timeout }).catch((e) => console.log(`    (skip click "${text}": ${e.message.split('\n')[0]})`));
  await page.waitForTimeout(600);
}

async function capture(browser, theme, viewport, tag) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await ctx.addInitScript(seed(theme));
  const page = await ctx.newPage();

  // Landing (post-gate)
  await page.goto(toolsUrl, { waitUntil: 'domcontentloaded' });
  await settle(page);
  await shoot(page, `${tag}-landing`);

  // Department selector — the app flow: landing usually leads into a dept grid.
  // Try to reach it; the exact CTA text may drift, so try a few.
  await clickText(page, 'Start');
  await clickText(page, 'New patient');
  await settle(page, 500);
  await shoot(page, `${tag}-departments`);

  // Into a department → the bedside cockpit (ClerkTab).
  await clickText(page, 'Medicine');
  await settle(page, 700);
  await shoot(page, `${tag}-clerk`);

  await ctx.close();
}

// Let playwright resolve Chromium from PLAYWRIGHT_BROWSERS_PATH (it finds the
// versioned dir, e.g. chromium-1194, on its own).
const browser = await chromium.launch({ headless: true });

try {
  for (const theme of ['light', 'dark']) {
    console.log(`\n[${theme}] desktop`);
    await capture(browser, theme, DESKTOP, `desktop-${theme}`);
    console.log(`[${theme}] phone`);
    await capture(browser, theme, PHONE, `phone-${theme}`);
  }
  console.log(`\nDone → ${outDir}`);
} finally {
  await browser.close();
}
