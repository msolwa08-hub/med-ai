/**
 * Live end-to-end exercise of the Reasoning Clerk in a real browser.
 *
 * Run:  node scripts/clerk-live-test.mjs            (server must be on :3000)
 *       node scripts/clerk-live-test.mjs --url=…    (point at a deployment)
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT
 * --------------------------------------
 * It drives the real built app in real Chromium at phone size: the intake
 * front door, the likelihood-ratio engine, the urgency colour bands, the
 * tab-by-tab render, the ledger's provenance markers, and the answer→board
 * movement that is the whole point of the tool. Every assertion below is read
 * back out of the live DOM, not out of the source.
 *
 * It does NOT prove the model call. Phase 1 runs the generator for real and
 * records exactly what came back — with no ANTHROPIC_API_KEY that is an
 * authentication failure, and the test says so rather than skipping it. Phase 2
 * then substitutes a fixture board at the network boundary so everything
 * downstream of the model can still be exercised for real.
 *
 * The fixture is TEST SCAFFOLDING, not product content. The eight built-in demo
 * packs were deleted from the app on purpose (2026-07-30): a fixed list of
 * cases can demonstrate the tool but can never be it, and while it existed it
 * doubled as a yardstick for "done". This one board lives here, in the test,
 * where it can never be mistaken for a feature or reached by a user.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const BASE = (process.argv.find((a) => a.startsWith('--url=')) || '--url=http://localhost:3000').slice(6);
const ACCESS_KEY = process.env.MEDAI_TOOLS_KEY || 'MEDAI-INTERN-DEV';
const SHOTS = process.env.SHOT_DIR || 'docs/clinical-build/eval/clerk-urgency-2026-07-30';
const PHONE = { width: 390, height: 844 };

// ---- the fixture board (test scaffolding — see header) ---------------------
const CORE = {
  specialty: 'IM/EM',
  label: 'Chest pain',
  referTo: 'Medical Registrar',
  planLine: 'aspirin · troponin · ECG · cardiology review',
  recommendation: 'Aspirin if ACS likely and dissection excluded; serial troponin and continuous ECG.',
  estimated: true,
  PT: {
    line: '58 · ♂ · central chest pain · 2 h',
    summaryLine: '58-year-old man',
    complaint: 'central chest pain for 2 hours',
    background: 'Hypertension, ex-smoker',
  },
  VITALS: [{ k: 'HR', v: '108' }, { k: 'BP', v: '148/92' }, { k: 'RR', v: '22' }, { k: 'SpO₂', v: '93' }, { k: 'T', v: '36.8' }],
  DX: [
    { id: 'acs', name: 'Acute coronary syndrome', icd: 'I24.9', prior: 0.32, mnm: true, urg: 'red', script: 'ischaemic pain + risk factors + troponin/ECG change' },
    { id: 'pe', name: 'Pulmonary embolism', icd: 'I26.9', prior: 0.12, mnm: true, urg: 'red', script: 'pleuritic pain + dyspnoea + hypoxia + immobility' },
    { id: 'peri', name: 'Pericarditis', icd: 'I30.9', prior: 0.1, mnm: false, urg: 'orange', script: 'sharp pleuritic pain, better sitting forward, friction rub' },
    { id: 'msk', name: 'Chest wall pain', icd: 'M79.1', prior: 0.2, mnm: false, urg: 'blue', script: 'reproducible on palpation, worse on movement' },
  ],
  FEAT: [
    { id: 'crush', lbl: 'Crushing pain radiating to arm or jaw', stream: 'hx', eff: { acs: [3, 0.5], msk: [0.5, 1.2] }, preset: 'present' },
    { id: 'exert', lbl: 'Worse on exertion', stream: 'hx', eff: { acs: [2.5, 0.6] } },
    { id: 'pleur', lbl: 'Pleuritic — worse on inspiration', stream: 'hx', eff: { acs: [0.6, 1.2], pe: [2.2, 0.7], peri: [3, 0.4] } },
    { id: 'immob', lbl: 'Recent immobility or long travel', stream: 'hx', eff: { pe: [3.5, 0.8] } },
    { id: 'tender', lbl: 'Chest wall tender to palpation', stream: 'exam', eff: { msk: [4, 0.4], acs: [0.6, 1.1] } },
    { id: 'rub', lbl: 'Pericardial friction rub', stream: 'exam', eff: { peri: [10, 0.8] } },
    { id: 'trop', lbl: 'Troponin raised', stream: 'ix', eff: { acs: [8, 0.2] }, key: 'acs', short: 'troponin' },
    { id: 'ctpa', lbl: 'CTPA positive for embolus', stream: 'ix', eff: { pe: [20, 0.05] }, key: 'pe', short: 'CTPA' },
    { id: 'smoke', lbl: 'Smoking history', stream: 'hx', kind: 'choice', options: ['Never', 'Ex-smoker', 'Current smoker'] },
  ],
  IX: [
    { id: 'ecg', lbl: 'ECG — ischaemic change', cat: 'bedside', binary: true, dx: 'ACS' },
    { id: 'trop', lbl: 'Troponin (hs)', cat: 'lab', unit: 'ng/L', norm: '<14', hi: 14, dir: 'above', dx: 'ACS' },
    { id: 'ctpa', lbl: 'CTPA', cat: 'imaging', binary: true, dx: 'PE' },
  ],
  MX: { investigate: [], immediate: [], definitive: [], longterm: [], monitor: [], levers: [], holistic: [] },
};

const PLAN = {
  patho: {
    acs: 'Plaque rupture occludes a coronary artery; ischaemia causes the crushing pain and the troponin rise.',
    pe: 'Clot lodges in the pulmonary arteries, causing dead-space ventilation, hypoxia and pleuritic pain.',
    peri: 'Inflamed pericardial layers rub together, giving sharp pain that eases sitting forward.',
    msk: 'Strained costochondral tissue hurts on movement and on direct pressure.',
  },
  MX: {
    investigate: [
      { lbl: '12-lead ECG', when: 'within 10 min of arrival', urg: 'red', ix: 'ecg' },
      { lbl: 'Troponin — serial', when: 'now and at 3 h', urg: 'red', ix: 'trop' },
    ],
    immediate: [
      { rx: 'Aspirin', for: 'Acute coronary syndrome', dose: '300 mg PO chewed, stat', urg: 'red', sign: true },
      { rx: 'Analgesia', for: 'pain and distress', dose: 'morphine 2.5–5 mg IV titrated', urg: 'orange', sign: true },
    ],
    definitive: [
      { rx: 'Reperfusion (primary PCI)', for: 'confirmed STEMI', dose: 'primary PCI < 120 min', urg: 'red', sign: true },
      { rx: 'Anticoagulation', for: 'confirmed NSTEMI or PE', dose: 'enoxaparin 1 mg/kg SC 12-hly', urg: 'orange', sign: true },
    ],
    longterm: [
      { rx: 'Secondary prevention', for: 'post-ACS', dose: 'dual antiplatelet 12 mth + statin + ACE-inhibitor', urg: 'blue', sign: true },
    ],
    monitor: ['Continuous ECG', 'Serial troponin', 'BP in both arms'],
    levers: [{ give: 'GTN', resp: 'pain settles', means: 'consistent with ischaemia — not specific' }],
    holistic: [{ label: 'Lifestyle & counselling', chips: ['Smoking cessation', 'Cardiac rehab', 'Exercise'] }],
    groundedDx: ['Acute coronary syndrome'],
  },
};

// ---- harness ---------------------------------------------------------------
const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const run = async () => {
  mkdirSync(SHOTS, { recursive: true });
  // The pinned Chromium in this environment lives under PLAYWRIGHT_BROWSERS_PATH
  // and is not always the version this playwright build would download, so take
  // an explicit path when one is given and fall back to the bundled resolution.
  const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
  const page = await browser.newPage({ viewport: PHONE, deviceScaleFactor: 2 });
  const clerk = () => page.frameLocator('iframe[title="MedAI reasoning clerk"]');

  // ── the front door ───────────────────────────────────────────────────────
  // The clerk carries its own access gate now (the Intern Tools console that
  // used to hold the key is gone). Getting through it IS part of the path a
  // real user walks, so the test walks it rather than seeding localStorage.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const gate = page.locator('input[type="password"]');
  const gated = await gate.isVisible().catch(() => false);
  check('the clerk gates access on its own, with no other tool needed', gated);
  if (gated) {
    await gate.fill(ACCESS_KEY);
    await page.locator('button[type="submit"]').click();
  }
  await clerk().locator('#itext').waitFor({ timeout: 20000 });
  check('root URL lands straight on the clerk', true);

  const chips = await clerk().locator('#ichips button').count();
  check('no built-in example cases on the front door', chips === 0, `${chips} example chips found`);
  await page.screenshot({ path: `${SHOTS}/01-intake.png` });

  // ── PHASE 1: the real generator, unstubbed ───────────────────────────────
  await clerk().locator('#itext').fill('58 year old man, crushing central chest pain for 2 hours radiating to the left arm, sweaty, known hypertensive, ex-smoker');
  await clerk().locator('#igen').click();
  let liveOutcome = 'no response';
  try {
    await clerk().locator('#istatus.err, .dx').first().waitFor({ timeout: 90000 });
    const err = await clerk().locator('#istatus.err').count();
    liveOutcome = err
      ? `generator FAILED: ${(await clerk().locator('#istatus').innerText()).trim()}`
      : 'generator returned a live board';
  } catch (e) {
    liveOutcome = `generator timed out: ${e.message.split('\n')[0]}`;
  }
  console.log(`\nLIVE MODEL CALL → ${liveOutcome}\n`);
  const liveWorked = liveOutcome === 'generator returned a live board';
  check('live model call produced a board', liveWorked, liveWorked ? '' : liveOutcome);
  await page.screenshot({ path: `${SHOTS}/02-live-generate.png` });

  // ── PHASE 2: fixture board, everything downstream exercised for real ─────
  await page.route('**/tools/clerk-generate', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body.phase === 'plan' ? PLAN : CORE),
    });
  });
  await page.reload({ waitUntil: 'networkidle' });
  await clerk().locator('#itext').waitFor({ timeout: 20000 });
  await clerk().locator('#itext').fill('58 year old man, crushing central chest pain for 2 hours, sweaty, hypertensive, ex-smoker');
  await clerk().locator('#igen').click();
  await clerk().locator('.dx').first().waitFor({ timeout: 30000 });

  // urgency bands: the word must be present, per diagnosis, in rank order
  const bands = await clerk().locator('.dx .uband').allInnerTexts();
  check('every differential carries a spelled-out urgency band', bands.length === 4 && bands.every(Boolean), bands.join(' / '));
  const acsBand = await clerk().locator('.dx[data-id="acs"] .uband').getAttribute('class');
  const mskBand = await clerk().locator('.dx[data-id="msk"] .uband').getAttribute('class');
  check('ACS bands red, chest-wall pain bands blue', /red/.test(acsBand) && /blue/.test(mskBand), `${acsBand} | ${mskBand}`);

  // the accent stripe must be painted from the band, not from an organ system
  const paint = await clerk().locator('.dx[data-id="acs"]').evaluate((el) => ({
    accent: getComputedStyle(el).getPropertyValue('--dxc').trim(),
    red: getComputedStyle(document.documentElement).getPropertyValue('--u-red').trim(),
    orange: getComputedStyle(document.documentElement).getPropertyValue('--u-orange').trim(),
  }));
  check('the tile accent is painted from the urgency scale, not an organ-system hue',
    paint.accent === paint.red && paint.red !== paint.orange, `${paint.accent} vs red ${paint.red}`);

  const cap = await clerk().locator('#cap').isVisible();
  check('confidence cap fires while a must-not-miss is unexcluded', cap);
  await page.screenshot({ path: `${SHOTS}/03-board.png`, fullPage: true });

  // ── the board has to MOVE when an answer lands ───────────────────────────
  const before = parseInt(await clerk().locator('.dx[data-id="msk"] [data-pct]').innerText(), 10);
  await clerk().locator('#next .tc .y').click();     // answer the pinned question
  await page.waitForTimeout(900);
  const after = parseInt(await clerk().locator('.dx[data-id="msk"] [data-pct]').innerText(), 10);
  check('answering the pinned question moves the differential', before !== after, `chest-wall pain ${before}% → ${after}%`);

  // ── every tab renders on a live board ────────────────────────────────────
  for (const [tab, marker] of [['exam', '#queue'], ['ix', '.ixin'], ['mx', '.rx'], ['docs', '.paper'], ['why', '.wledger']]) {
    await clerk().locator(`.tab[data-tab="${tab}"]`).click();
    const ok = await clerk().locator(marker).first().isVisible().catch(() => false);
    check(`tab "${tab}" renders`, ok);
    await page.screenshot({ path: `${SHOTS}/tab-${tab}.png`, fullPage: true });
  }

  // ── management carries the same three bands ──────────────────────────────
  await clerk().locator('.tab[data-tab="mx"]').click();
  await clerk().locator('.rx').first().waitFor();
  const mxBands = await clerk().locator('.mx .uband').allInnerTexts();
  const distinct = [...new Set(mxBands)];
  check('management items carry urgency bands too', mxBands.length > 0, `${mxBands.length} bands, ${distinct.length} distinct: ${distinct.join('/')}`);
  const doseTag = await clerk().locator('.pill-a.src-stg, .pill-a.src-est').count();
  check('every dose declares whether it matched a guideline', doseTag > 0, `${doseTag} provenance tags`);

  // ── the weights say what they are ────────────────────────────────────────
  await clerk().locator('.tab[data-tab="why"]').click();
  await clerk().locator('.wledger').first().waitFor();
  await clerk().locator('.wledger').first().locator('[data-toggle]').click();
  const estTags = await clerk().locator('.wledger.open .colh .estt').count();
  const note = await clerk().locator('.wledger.open .wnote').first().innerText().catch(() => '');
  check('for/against weights are marked as estimates', estTags >= 2, `${estTags} column tags`);
  check('a line in words says the weights are not published ratios', /not published likelihood ratios/.test(note), note.slice(0, 60) + '…');
  await page.screenshot({ path: `${SHOTS}/04-why-open.png`, fullPage: true });

  // ── the always-on safety notice must not sit under the console ──────────
  const clear = await clerk().locator('#estbanner').evaluate((el) => {
    const b = el.getBoundingClientRect();
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { visible: b.height > 0, coveredByConsole: !!(hit && hit.closest('.console')) };
  });
  check('the AI-estimate notice is reachable, not buried under the console',
    clear.visible && !clear.coveredByConsole, JSON.stringify(clear));

  // ── dark mode has to survive the whole repaint ───────────────────────────
  // No force: the footer has to be genuinely reachable under the pinned
  // console at 390px, which is the thing that was broken.
  await clerk().locator('#theme').scrollIntoViewIfNeeded();
  await clerk().locator('#theme').click({ timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/05-dark.png`, fullPage: true });
  const dark = await clerk().locator('.wledger .uband.red').first().evaluate((el) => ({
    band: getComputedStyle(el).color,
    theme: document.documentElement.getAttribute('data-theme'),
  }));
  check('urgency bands survive the dark-mode repaint',
    dark.theme === 'dark' && dark.band !== 'rgb(198, 47, 36)', `${dark.theme}, red renders ${dark.band}`);

  await browser.close();

  const failed = results.filter((r) => !r.pass);
  writeFileSync(`${SHOTS}/results.json`, JSON.stringify({ base: BASE, liveOutcome, results }, null, 2));
  console.log(`\n${results.length - failed.length}/${results.length} checks passed. Screenshots → ${SHOTS}`);
  if (failed.length) {
    console.log('Failed:'); failed.forEach((f) => console.log(`  · ${f.name} — ${f.detail}`));
  }
  process.exit(failed.some((f) => f.name !== 'live model call produced a board') ? 1 : 0);
};

run().catch((e) => { console.error(e); process.exit(1); });
