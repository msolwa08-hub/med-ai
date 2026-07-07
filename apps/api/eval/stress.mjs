// MedAI O&G STRESS TEST — behaves like an overwhelmed first-day intern abusing
// the app, across the full O&G diagnosis range, and checks whether the app both
// (a) stays easy and holds their hand, and (b) reasons at a level a consultant
// trusts — AND catches the intern's mistakes.
//
// It drives the LIVE app API (HTTP only — grades the shipped product). For each
// scenario it runs several MISTAKE MODES a real new intern makes:
//   clean          — honest, complete (baseline)
//   terse          — time-pressured one-word answers, detail dropped
//   skip           — omits critical fields (no time / forgot)
//   misplace       — puts an answer in the wrong place / wrong area
//   contradiction  — enters a fact that contradicts the clinical picture
//
// Every run is scored on THREE axes (each /100):
//   ACCESSIBLE (intern) ...... did it hand-hold and still produce usable outputs?
//   SOPHISTICATED (consultant) reasoning depth: dangerous-first differentials incl.
//                              the zebra, investigations-then-plan, the "why", and
//                              the mistake NOT corrupting the diagnosis
//   DISCREPANCY (the alarm) .. did the app FLAG the injected mistake (flag & guide)?

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.EVAL_MODEL || 'claude-sonnet-4-6';
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

const INTAKE_KEYS = new Set(['name', 'age', 'sex', 'ward', 'bed', 'admissionDate', 'admissionDiagnosis', 'allergies']);
const CLERK_FIELDS = [
  { key: 'name', label: 'Patient name' }, { key: 'age', label: 'Age' }, { key: 'sex', label: 'Sex' },
  { key: 'ward', label: 'Ward' }, { key: 'bed', label: 'Bed' },
  { key: 'admissionDiagnosis', label: 'Presenting/working diagnosis' }, { key: 'allergies', label: 'Allergies' },
  { key: 'chiefComplaint', label: 'Chief complaint' }, { key: 'hpi', label: 'History of presenting illness' },
  { key: 'gestationalAge', label: 'Gestational age' }, { key: 'lmp', label: 'LMP' },
  { key: 'gravida', label: 'Gravida' }, { key: 'para', label: 'Para' },
  { key: 'antenatalCare', label: 'Antenatal care / visits' }, { key: 'hivStatus', label: 'HIV status' },
  { key: 'pmh', label: 'Past medical/obstetric history' }, { key: 'medications', label: 'Current medications' },
  { key: 'vitals', label: 'Vitals' }, { key: 'examination', label: 'Examination findings' },
];

export const MODES = ['clean', 'terse', 'skip', 'misplace', 'contradiction'];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n) => Math.round(n * 10) / 10;
const lc = (s) => String(s || '').toLowerCase();
const containsAny = (hay, needles) => needles.some((n) => lc(hay).includes(lc(n)));

async function api(base, key, path, body) {
  let status = 0, json = null, attempts = 0;
  for (attempts = 1; attempts <= 3; attempts++) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tools-key': key }, body: JSON.stringify(body),
      });
      status = res.status;
      const text = await res.text();
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if (status < 500) break;
    } catch (e) { status = 0; json = { error: String(e) }; }
    if (attempts < 3) await new Promise((r) => setTimeout(r, 300 * attempts));
  }
  return { status, json, retries: attempts - 1 };
}

const MODE_BEHAVIOUR = {
  clean: 'Answer accurately and completely in clinical shorthand.',
  terse: 'You are rushed and overwhelmed. Answer in ONE or two words only. Drop detail. If a question is not immediately critical, answer "skip".',
  skip: 'You are overwhelmed and short on time. For anything you consider not urgent, answer "skip" — INCLUDING important-looking things you would forget under pressure.',
  misplace: 'You are flustered and new to the app. Sometimes you dump several unrelated facts into one answer, or answer a DIFFERENT question than the one asked (put information in the wrong place).',
  contradiction: 'Answer from the facts, but when relevant also assert the contradictory statement you were given, as if you typed it in without thinking.',
};

async function internAnswer(facts, behaviour, question, asked) {
  if (!anthropic) return asked === 0 ? facts : 'skip';
  const r = await anthropic.messages.create({
    model: MODEL, max_tokens: 200,
    system: `You are role-playing a specific overwhelmed South African O&G intern clerking a patient into an app. ${behaviour}\nUse ONLY these known facts; never invent clinical detail.\nFACTS:\n${facts}`,
    messages: [{ role: 'user', content: `App asks: "${question}"\nYour answer:` }],
  });
  return (r.content.find((b) => b.type === 'text')?.text || 'skip').trim();
}

const hasFlagLanguage = (s) =>
  /confirm|clarif|re-?check|recheck|are you sure|double-?check|inconsistent|contradic|cannot be|does not (match|fit)|doesn'?t (match|fit)|discrepan|verify|which is correct|conflicts?/i.test(String(s || ''));

async function runMode(scenario, mode, { base, key, maxTurns = 14 }) {
  const record = {};
  const transcript = [];
  const assistQuestions = [];
  const calls = [];
  let internChars = 0, turns = 0;
  const exp = scenario.expected;
  const facts = mode === 'contradiction' && exp.contradiction
    ? `${scenario.facts}\n(You also wrongly believe / type: ${exp.contradiction.inject})`
    : scenario.facts;
  const behaviour = MODE_BEHAVIOUR[mode];
  const context = `${scenario.ageSex}, ${scenario.title}`;

  for (turns = 0; turns < maxTurns; turns++) {
    const fields = CLERK_FIELDS.map((f) => ({ ...f, value: record[f.key] || '' }));
    const r = await api(base, key, '/tools/assist', { dept: scenario.dept, subDept: scenario.subDept, section: 'Clerking', fields, transcript, context });
    calls.push({ path: 'assist', ...r });
    if (r.status !== 200 || !r.json) break;
    const q = r.json.nextQuestion || '';
    assistQuestions.push(q);
    Object.assign(record, r.json.updates || {});
    if (r.json.done) break;
    if (!q) break;
    const answer = await internAnswer(facts, behaviour, q, turns);
    internChars += answer.length;
    transcript.push({ role: 'assistant', content: q });
    transcript.push({ role: 'user', content: answer });
  }

  const intake = {}, history = {}, assessment = {};
  for (const [k, v] of Object.entries(record)) {
    if (INTAKE_KEYS.has(k)) intake[k] = v;
    else if (k === 'vitals' || k === 'examination') assessment[k] = v;
    else history[k] = v;
  }

  const prob = await api(base, key, '/tools/suggest-problems', { dept: scenario.dept, intake, history, assessment });
  calls.push({ path: 'suggest-problems', ...prob });
  const problems = prob.json?.problems || [];
  const probText = JSON.stringify(prob.json || {});
  const safety = prob.json?.safety || [];

  const round = await api(base, key, '/tools/ward-round-delta', {
    dept: scenario.dept, subDept: scenario.subDept, patientContext: context,
    problems: problems.map((p) => [p.problem, p.workingDx].filter(Boolean).join(' — ')),
    history: [history.chiefComplaint, history.hpi].filter(Boolean).join(' — '),
    focusedExam: assessment.examination, vitals: assessment.vitals,
    allergies: intake.allergies, medications: history.medications, previousRounds: [],
  });
  calls.push({ path: 'ward-round-delta', ...round });
  const roundJson = round.json || {};
  const roundText = JSON.stringify(roundJson);

  const pres = await api(base, key, '/tools/present-patient', {
    dept: scenario.dept, subDept: scenario.subDept, ...intake, ...history, ...assessment,
    problems: problems.map((p) => ({ problem: p.problem, workingDx: p.workingDx })),
  });
  calls.push({ path: 'present-patient', ...pres });
  const presText = `${pres.json?.oneLineSummary || ''}\n${pres.json?.presentation || ''}`;

  const allAppText = [assistQuestions.join(' '), probText, roundText, presText, JSON.stringify(safety), prob.json?.note || ''].join(' ');

  // ── ACCESSIBLE (intern) ──
  const captured = Object.values(record).filter((v) => String(v || '').trim()).length;
  const outputs = [captured >= 5, problems.length > 0, !!roundJson.onExamination, !!pres.json?.presentation].filter(Boolean).length;
  // recovery: for skip/terse, did the app re-ask a skipped critical field? (the completeness guard)
  const reAskedCritical = (exp.criticalFields || []).some((f) => assistQuestions.some((q) => lc(q).includes(lc(f.split(' ')[0]))));
  const noCrash = calls.every((c) => c.status < 500 && c.status !== 0);
  const accessible = pct(clamp(
    (outputs / 4) * 60 + (reAskedCritical ? 20 : 0) + (noCrash ? 20 : 0)
  ));

  // ── SOPHISTICATED (consultant) ──
  const dxOk = containsAny(probText, exp.workingDx || []);
  const diffs = exp.differentials || [];
  const diffHits = diffs.filter((d) => lc(probText).includes(lc(d.split(' ')[0]))).length;
  const diffScore = diffs.length ? diffHits / diffs.length : 0;
  const hasIx = /investigation|bloods|scan|ultrasound|ogtt|hcg|fbc|u&e|ctg|swab|culture/i.test(probText + roundText);
  const hasPlan = problems.some((p) => (p.management || []).length > 0) || (roundJson.suggestedManagement || []).length > 0;
  const ixThenPlan = hasIx && hasPlan;
  const reasoning = String(roundJson.consultantLogicExplanation || '').length > 40;
  const errorNotPropagated = dxOk; // despite the mistake, the working dx is still right
  const sophisticated = pct(clamp(
    (dxOk ? 25 : 0) + diffScore * 30 + (ixThenPlan ? 20 : 0) + (reasoning ? 15 : 0) + (errorNotPropagated ? 10 : 0)
  ));

  // ── DISCREPANCY (the alarm) ──
  let discrepancyExpected = false, discrepancyCaught = false, discrepancyNote = '';
  if (mode === 'contradiction' && exp.contradiction) {
    discrepancyExpected = true;
    // caught = the app used flagging language AND referenced the contradicted item
    discrepancyCaught = hasFlagLanguage(allAppText) && containsAny(allAppText, exp.contradiction.signal);
    discrepancyNote = discrepancyCaught ? 'flagged the contradiction' : 'MISSED the contradiction (no alarm)';
  } else if (mode === 'skip') {
    discrepancyExpected = true;
    discrepancyCaught = reAskedCritical;
    discrepancyNote = discrepancyCaught ? 're-asked a skipped critical field' : 'let critical fields stay blank silently';
  }
  const discrepancy = discrepancyExpected ? (discrepancyCaught ? 100 : 0) : null;

  const overall = pct(
    discrepancy === null
      ? 0.4 * accessible + 0.6 * sophisticated
      : 0.30 * accessible + 0.40 * sophisticated + 0.30 * discrepancy
  );

  return {
    mode, turns, captured, internChars,
    accessible, sophisticated, discrepancy, overall,
    detail: { dxOk, diffHits, diffTotal: diffs.length, ixThenPlan, reasoning, reAskedCritical, noCrash, discrepancyExpected, discrepancyCaught, discrepancyNote },
    failures: calls.filter((c) => c.status >= 500 || c.status === 0).map((c) => `${c.path}→${c.status}`),
  };
}

export async function stressScenario(scenario, opts) {
  const runs = [];
  for (const mode of (opts.modes || MODES)) {
    runs.push(await runMode(scenario, mode, opts));
  }
  const mean = (sel) => pct(runs.reduce((a, r) => a + (sel(r) ?? 0), 0) / runs.length);
  const discRuns = runs.filter((r) => r.discrepancy !== null);
  return {
    id: scenario.id, title: scenario.title, setting: scenario.setting, runs,
    accessible: mean((r) => r.accessible),
    sophisticated: mean((r) => r.sophisticated),
    discrepancy: discRuns.length ? pct(discRuns.reduce((a, r) => a + r.discrepancy, 0) / discRuns.length) : null,
    overall: mean((r) => r.overall),
  };
}

export function aggregate(results) {
  const mean = (sel) => pct(results.reduce((a, r) => a + (sel(r) ?? 0), 0) / Math.max(results.length, 1));
  const disc = results.filter((r) => r.discrepancy !== null);
  return {
    n: results.length,
    accessible: mean((r) => r.accessible),
    sophisticated: mean((r) => r.sophisticated),
    discrepancy: disc.length ? pct(disc.reduce((a, r) => a + r.discrepancy, 0) / disc.length) : null,
    overall: mean((r) => r.overall),
    usedAI: !!anthropic,
  };
}
