// Seed a patient with trended results, open Results, screenshot the visual
// learning aid (sparklines vs reference bands + teaching interpretation).
import playwright from '/opt/node22/lib/node_modules/playwright/index.js';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const { chromium } = playwright;

const out = resolve(process.argv[2] || 'docs/clinical-build/eval/m-ui2/results');
const theme = process.argv[3] || 'light';
mkdirSync(out, { recursive: true });
const base = 'http://localhost:3000';
const key = 'MEDAI-INTERN-DEV';

const patient = {
  id: 'p1',
  intake: { name: 'Demo', age: '62', sex: 'M', ward: '', bed: '', admissionDate: '', admissionDiagnosis: 'chest pain', allergies: '' },
  history: { chiefComplaint: 'Chest pain', hpi: '', pmh: '', medications: '', familyHistory: '', socialHistory: '', ros: '' },
  assessment: { vitals: '', generalExam: '', examination: '', investigations: '', dayOfAdmission: '' },
  problems: [],
  roundData: { plan: '', pending: '', subjective: '' },
  investigations: [
    { date: '2026-07-09', panel: 'uec', values: { na: '134', k: '5.0', urea: '8', creat: '150', egfr: '45' } },
    { date: '2026-07-10', panel: 'uec', values: { na: '128', k: '6.2', urea: '11', creat: '190', egfr: '32' } },
    { date: '2026-07-09', panel: 'fbc', values: { hb: '9.5', wcc: '16', plt: '95', mcv: '78' } },
    { date: '2026-07-10', panel: 'fbc', values: { hb: '8.8', wcc: '19', plt: '70', mcv: '77' } },
    { date: '2026-07-09', panel: 'inflam', values: { crp: '120' } },
    { date: '2026-07-10', panel: 'inflam', values: { crp: '180' } },
  ],
};
const state = { dept: 'medicine', subDept: null, patients: [patient], activePatientId: 'p1' };

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 2000 }, deviceScaleFactor: 2 });
await ctx.addInitScript(({ k, s, th }) => {
  localStorage.setItem('medai_tools_key', k);
  localStorage.setItem('medai_theme', th);
  localStorage.setItem('medai_tools_state_v1', JSON.stringify(s));
}, { k: key, s: state, th: theme });
const page = await ctx.newPage();
const log = (...a) => console.log(...a);
const tap = async (txt, t = 5000) => { try { await page.getByText(txt, { exact: false }).first().click({ timeout: t }); log('  tap', txt); await page.waitForTimeout(600); } catch { log('  (miss', txt + ')'); } };

try {
  await page.goto(`${base}/tools`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  await tap('Complete the record');
  await page.waitForTimeout(700);
  // Target the Results STAGE header exactly (avoids the "…results" subtitle).
  try { await page.getByText('Results', { exact: true }).first().click({ timeout: 5000 }); log('  tap Results (exact)'); } catch { log('  (miss Results exact)'); }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: resolve(out, `results-insights-${theme}.png`), fullPage: true });
  log('  shot results-insights-' + theme);
  // Expand the K insight to reveal the teaching panel.
  try { await page.getByText('Potassium', { exact: false }).first().click({ timeout: 3000 }); log('  tap Potassium'); } catch { log('  (miss Potassium)'); }
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(out, `results-expanded-${theme}.png`), fullPage: true });
  log('  shot results-expanded-' + theme);
} catch (e) {
  log('ERROR', e.message);
  await page.screenshot({ path: resolve(out, 'error.png') });
} finally {
  await browser.close();
}
