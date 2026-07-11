// Seed a patient with a blood gas + U&E (incl. chloride), open Results, and
// screenshot the acid–base map (the ABG visual learning aid). Pure client render
// — no API needed. Usage: node scripts/drive-abg.mjs <outDir> <light|dark> <port>
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = playwright;

const out = resolve(process.argv[2] || 'docs/clinical-build/eval/m-ui3/abg');
const theme = process.argv[3] || 'light';
const port = process.argv[4] || '5178';
mkdirSync(out, { recursive: true });
const base = `http://127.0.0.1:${port}`;
const key = 'MEDAI-INTERN-DEV';

// A DKA-style high-anion-gap metabolic acidosis with appropriate respiratory
// compensation — the classic teaching gas. pCO₂ in kPa.
const patient = {
  id: 'p1',
  intake: { name: 'Demo', age: '24', sex: 'F', ward: '', bed: '', admissionDate: '', admissionDiagnosis: 'DKA', allergies: '' },
  history: { chiefComplaint: 'Vomiting, drowsy', hpi: '', pmh: '', medications: '', familyHistory: '', socialHistory: '', ros: '' },
  assessment: { vitals: '', generalExam: '', examination: '', investigations: '', dayOfAdmission: '' },
  problems: [],
  roundData: { plan: '', pending: '', subjective: '' },
  investigations: [
    { date: '2026-07-11', panel: 'abg', values: { ph: '7.18', pco2: '3.0', po2: '13', hco3: '10', lact: '1.4' } },
    { date: '2026-07-11', panel: 'uec', values: { na: '140', k: '5.4', cl: '100', urea: '9', creat: '105', egfr: '62' } },
    { date: '2026-07-11', panel: 'glucose', values: { glu: '28' } },
  ],
};
const state = { dept: 'medicine', subDept: null, patients: [patient], activePatientId: 'p1' };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 2200 }, deviceScaleFactor: 2 });
await ctx.addInitScript(({ k, s, th }) => {
  localStorage.setItem('medai_tools_key', k);
  localStorage.setItem('medai_theme', th);
  localStorage.setItem('medai_tools_state_v1', JSON.stringify(s));
}, { k: key, s: state, th: theme });
const page = await ctx.newPage();
const log = (...a) => console.log(...a);

try {
  await page.goto(`${base}/tools`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  try { await page.getByText('Complete the record', { exact: false }).first().click({ timeout: 4000 }); log('  tap Complete'); } catch { log('  (no Complete banner)'); }
  await page.waitForTimeout(600);
  try { await page.getByText('Results', { exact: true }).first().click({ timeout: 5000 }); log('  tap Results'); } catch { log('  (miss Results)'); }
  await page.waitForTimeout(1200);
  // The acid–base map is open by default; capture the full results surface.
  await page.screenshot({ path: resolve(out, `abg-map-${theme}.png`), fullPage: true });
  log('  shot abg-map-' + theme);
  // Scroll the acid–base map into view and tightly crop it if present.
  const map = page.getByText('Acid–base map', { exact: false }).first();
  try {
    await map.scrollIntoViewIfNeeded({ timeout: 3000 });
    const card = page.locator('div', { has: map }).first();
    await card.screenshot({ path: resolve(out, `abg-card-${theme}.png`) });
    log('  shot abg-card-' + theme);
  } catch { log('  (map card not found for crop)'); }
} catch (e) {
  log('ERROR', e.message);
  await page.screenshot({ path: resolve(out, 'error.png') });
} finally {
  await browser.close();
}
