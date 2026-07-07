// MedAI intern-tools evaluation harness (core).
//
// Drives the LIVE app API through a full O&G clerking the way an intern would,
// then scores the run out of 100 from four perspectives. SPEED is the headline:
// the app is an AID — the intern is still writing and thinking, so if it is not
// FASTER than doing it by hand, it fails, no matter how clever the output.
//
// Perspectives (each /100), weighted into the overall:
//   SPEED & EASE (intern) .... 40%  turns, typing burden, lag, time-saved-vs-paper
//   CLINICAL QUALITY (consultant) 30%  right dx / problems / safety / complete output
//   LEGIBILITY (human) ....... 20%  plain text, no markdown, structured, copyable
//   RELIABILITY (system) ..... 10%  no 500s, latency within budget
//
// No app source is imported — it only speaks HTTP, so it measures the shipped
// product, not the code's intentions.

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.EVAL_MODEL || 'claude-sonnet-4-6';
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

// A representative O&G clerking field set (mirrors the app's intake + history
// fields). Which slice a key belongs to drives how the record is posted on.
const INTAKE_KEYS = new Set(['name', 'age', 'sex', 'ward', 'bed', 'admissionDate', 'admissionDiagnosis', 'allergies']);
const CLERK_FIELDS = [
  { key: 'name', label: 'Patient name' },
  { key: 'age', label: 'Age' },
  { key: 'sex', label: 'Sex' },
  { key: 'ward', label: 'Ward' },
  { key: 'bed', label: 'Bed' },
  { key: 'admissionDiagnosis', label: 'Presenting/working diagnosis' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'chiefComplaint', label: 'Chief complaint' },
  { key: 'hpi', label: 'History of presenting illness' },
  { key: 'gestationalAge', label: 'Gestational age' },
  { key: 'lmp', label: 'LMP' },
  { key: 'gravida', label: 'Gravida' },
  { key: 'para', label: 'Para' },
  { key: 'antenatalCare', label: 'Antenatal care / visits' },
  { key: 'hivStatus', label: 'HIV status' },
  { key: 'pmh', label: 'Past medical/obstetric history' },
  { key: 'medications', label: 'Current medications' },
  { key: 'vitals', label: 'Vitals' },
  { key: 'examination', label: 'Examination findings' },
];

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const pct = (n) => Math.round(n * 10) / 10;

async function api(base, key, path, body) {
  const t0 = process.hrtime.bigint();
  let status = 0;
  let json = null;
  let attempts = 0;
  for (attempts = 1; attempts <= 3; attempts++) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tools-key': key },
        body: JSON.stringify(body),
      });
      status = res.status;
      const text = await res.text();
      try { json = JSON.parse(text); } catch { json = { raw: text }; }
      if (status < 500) break;               // client-side handling; 5xx retries
    } catch (e) {
      status = 0; json = { error: String(e) };
    }
    if (attempts < 3) await new Promise((r) => setTimeout(r, 300 * attempts));
  }
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  return { status, json, ms, retries: attempts - 1 };
}

// The AI plays the intern: answers the app's next question tersely from the
// scenario facts, the way a busy clerk types. Falls back to dumping the facts on
// the first turn when no Anthropic key is available.
async function internAnswer(facts, question, asked) {
  if (!anthropic) return asked === 0 ? facts : 'skip';
  const r = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: `You are a busy South African O&G intern clerking a patient into an app. Answer the app's question TERSELY in clinical shorthand, using ONLY these known facts. If a fact is unknown, say "unknown" or "skip". Never invent. Facts:\n${facts}`,
    messages: [{ role: 'user', content: `App asks: "${question}"\nYour short answer:` }],
  });
  return (r.content.find((b) => b.type === 'text')?.text || 'skip').trim();
}

const hasMarkdown = (s) => /\*\*|`|(^|\n)\s*#{1,6}\s|(^|\n)\s*[-*]\s/.test(String(s || ''));
const containsAny = (hay, needles) =>
  needles.some((n) => String(hay || '').toLowerCase().includes(n.toLowerCase()));

export async function runScenario(scenario, { base, key, maxTurns = 14 }) {
  const wall0 = Date.now();
  const calls = [];
  const record = {};
  const transcript = [];
  let internChars = 0;
  let turns = 0;
  const context = `${scenario.ageSex}, ${scenario.title}`;

  // ── 1. CLERK: drive /tools/assist to completion, the way the Clerk page does.
  for (turns = 0; turns < maxTurns; turns++) {
    const fields = CLERK_FIELDS.map((f) => ({ ...f, value: record[f.key] || '' }));
    const r = await api(base, key, '/tools/assist', {
      dept: scenario.dept, subDept: scenario.subDept, section: 'Clerking', fields, transcript, context,
    });
    calls.push({ path: 'assist', ...r });
    if (r.status !== 200 || !r.json) break;
    const q = r.json.nextQuestion || '';
    Object.assign(record, r.json.updates || {});
    if (r.json.done) break;
    if (!q) break;
    const answer = await internAnswer(scenario.facts, q, turns);
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

  // ── 2. PROBLEMS
  const prob = await api(base, key, '/tools/suggest-problems', {
    dept: scenario.dept, intake, history, assessment,
  });
  calls.push({ path: 'suggest-problems', ...prob });
  const problems = (prob.json?.problems || []);
  const problemsText = JSON.stringify(problems).toLowerCase();
  const safety = (prob.json?.safety || []);

  // ── 3. WARD ROUND
  const round = await api(base, key, '/tools/ward-round-delta', {
    dept: scenario.dept, subDept: scenario.subDept,
    patientContext: context,
    problems: problems.map((p) => [p.problem, p.workingDx].filter(Boolean).join(' — ')),
    history: [history.chiefComplaint, history.hpi].filter(Boolean).join(' — '),
    focusedExam: assessment.examination, vitals: assessment.vitals,
    allergies: intake.allergies, medications: history.medications,
    previousRounds: [],
  });
  calls.push({ path: 'ward-round-delta', ...round });
  const roundText = JSON.stringify(round.json || {});

  // ── 4. CONSULTANT PRESENTATION
  const pres = await api(base, key, '/tools/present-patient', {
    dept: scenario.dept, subDept: scenario.subDept, ...intake, ...history, ...assessment,
    problems: problems.map((p) => ({ problem: p.problem, workingDx: p.workingDx })),
  });
  calls.push({ path: 'present-patient', ...pres });
  const presText = `${pres.json?.oneLineSummary || ''}\n${pres.json?.presentation || ''}`;

  const wallSec = (Date.now() - wall0) / 1000;

  // ── SCORING ────────────────────────────────────────────────────────────────
  const exp = scenario.expected;

  // SPEED & EASE (intern). Gated by whether the clerk ACTUALLY captured a record
  // — you cannot be "fast" at doing nothing, so a broken/empty run can't score
  // speed on 0 turns / 0 typing.
  const fieldsFilled = Object.values(record).filter((v) => String(v || '').trim()).length;
  const workFactor = clamp(fieldsFilled / 8, 0, 1);        // expect ~8+ fields on a real clerk
  const turnsScore = clamp((8 / Math.max(turns, 1)) * 100) * workFactor;
  const typingScore = clamp((220 / Math.max(internChars, 1)) * 100) * workFactor;
  const assistCalls = calls.filter((c) => c.path === 'assist');
  const meanAssistMs = assistCalls.length ? assistCalls.reduce((a, c) => a + c.ms, 0) / assistCalls.length : 0;
  const latencyScore = clamp((3500 / Math.max(meanAssistMs, 1)) * 100);
  // Handwrite baseline: words in the final round note + presentation, at ~20 wpm
  // (3s/word) — what the intern would spend writing the same by hand. Only counts
  // when the app actually produced a note (no output = no time saved).
  const producedWords = `${round.json ? JSON.stringify(round.json) : ''} ${presText}`.split(/\s+/).filter(Boolean).length;
  const realOutput = producedWords >= 25 && !!(round.json?.onExamination || pres.json?.presentation);
  const handwriteSec = producedWords * 3;
  const timeSavedScore = realOutput ? clamp((handwriteSec / Math.max(wallSec, 1)) * 100) : 0;
  const speed = pct(0.30 * turnsScore + 0.25 * typingScore + 0.20 * latencyScore + 0.25 * timeSavedScore);

  // CLINICAL QUALITY (consultant)
  const qDx = containsAny(problemsText, exp.workingDx || []) ? 1 : 0;
  const qProblems = (exp.problems || []).every((n) => problemsText.includes(n.toLowerCase())) ? 1 : 0;
  // A teratogen-by-design drug (methotrexate in ectopic) must NOT be hard-BLOCKed.
  const qNoWrongBlock = !(exp.safetyMustNotBlock || []).some((d) =>
    safety.some((w) => w.severity === 'BLOCK' && w.drug.toLowerCase().includes(d))) ? 1 : 0;
  const qPres = containsAny(presText, exp.presentationMustContain || []) ? 1 : 0;
  const qParts = [qDx, qProblems, qNoWrongBlock, qPres];
  const quality = pct((qParts.reduce((a, b) => a + b, 0) / qParts.length) * 100);

  // LEGIBILITY (human) — markdown is the cardinal sin (it lands on a paper chart)
  const anyMarkdown = [roundText, presText, problemsText].some(hasMarkdown);
  const roundStructured = containsAny(roundText, ['plan', 'subjective', 'exam', 'management']) ? 1 : 0;
  const presStructured = containsAny(presText, ['situation', 'background', 'assessment', 'recommendation']) ? 1 : 0;
  let legibility = pct(((roundStructured + presStructured) / 2) * 100);
  if (anyMarkdown) legibility = pct(Math.min(legibility, 40)); // hard cap on stars

  // RELIABILITY (system)
  const ok = calls.filter((c) => c.status >= 200 && c.status < 300).length;
  const totalRetries = calls.reduce((a, c) => a + c.retries, 0);
  const reliability = pct(clamp((ok / Math.max(calls.length, 1)) * 100 - totalRetries * 10));

  const overall = pct(0.40 * speed + 0.30 * quality + 0.20 * legibility + 0.10 * reliability);

  return {
    id: scenario.id, title: scenario.title,
    metrics: { turns, internChars, meanAssistMs: pct(meanAssistMs), wallSec: pct(wallSec), handwriteSec: pct(handwriteSec), producedWords },
    perspectives: {
      speed: { score: speed, turnsScore: pct(turnsScore), typingScore: pct(typingScore), latencyScore: pct(latencyScore), timeSavedScore: pct(timeSavedScore) },
      quality: { score: quality, dx: qDx, problems: qProblems, noWrongBlock: qNoWrongBlock, presentation: qPres },
      legibility: { score: legibility, markdownFound: anyMarkdown, roundStructured, presStructured },
      reliability: { score: reliability, ok, total: calls.length, retries: totalRetries },
    },
    overall,
    failures: calls.filter((c) => c.status >= 500 || c.status === 0).map((c) => `${c.path} → ${c.status}`),
  };
}

export function aggregate(results) {
  const mean = (sel) => pct(results.reduce((a, r) => a + sel(r), 0) / Math.max(results.length, 1));
  return {
    overall: mean((r) => r.overall),
    speed: mean((r) => r.perspectives.speed.score),
    quality: mean((r) => r.perspectives.quality.score),
    legibility: mean((r) => r.perspectives.legibility.score),
    reliability: mean((r) => r.perspectives.reliability.score),
    n: results.length,
    usedAI: !!anthropic,
  };
}
