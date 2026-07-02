// AI end-to-end smoke test — exercises every AI path against a running API.
// Requires a real ANTHROPIC_API_KEY in apps/api/.env and seeded test users.
const BASE = process.env.API_URL ?? 'http://localhost:3000';
let pass = 0, fail = 0;

async function step(name, fn) {
  try {
    const out = await fn();
    console.log(`PASS  ${name}${out ? ` — ${out}` : ''}`);
    pass++;
    return true;
  } catch (err) {
    console.log(`FAIL  ${name} — ${err.message}`);
    fail++;
    return false;
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

const state = {};

// ── Setup ─────────────────────────────────────────────────────────────────────
await step('logins + fresh consultation', async () => {
  const p = await call('POST', '/auth/login', {
    body: { email: 'patient@example.com', password: 'Patient@1234' },
  });
  state.patientToken = p.json.data.accessToken;
  const d = await call('POST', '/auth/login', {
    body: { email: 'dr.van-wyk@example.com', password: 'Doctor@1234' },
  });
  state.doctorToken = d.json.data.accessToken;
  const me = await call('GET', '/doctors/me', { token: state.doctorToken });
  state.doctorId = me.json.data?.id ?? me.json.data?.doctor?.id;
  // Ensure the doctor is available with a fresh location (dispatch + TTL path)
  await call('PUT', '/doctors/availability', {
    token: state.doctorToken,
    body: { isAvailable: true, lat: -26.2041, lng: 28.0473, radius: 25 },
  });

  // UNASSIGNED consultation with a booking location — exercises the dispatch
  // engine: triage stamping, geo-filtered queue, push fan-out on completion.
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', patientLat: -26.19, patientLng: 28.04 },
  });
  state.consultationId = c.json.data?.id ?? c.json.data?.consultationId;
  expect(state.consultationId, 'no consultation');
  // POPIA: the doctor may only read history / run reasoning with granted consent
  await call('POST', '/patients/me/consents', {
    token: state.patientToken,
    body: { doctorId: state.doctorId, consentType: 'VIEW_HISTORY' },
  });
  return `consultation ${String(state.consultationId).slice(0, 8)}…`;
});

// ── Specialty history: INTERNAL (disease-system branching) ────────────────────
await step('INTERNAL start (chest pain → system detection)', async () => {
  const r = await call('POST', '/specialty-history/start', {
    token: state.patientToken,
    body: {
      consultationId: state.consultationId,
      department: 'INTERNAL',
      language: 'en',
      chiefComplaint: 'crushing chest pain when I walk uphill',
    },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.message?.length > 10, 'no opening message');
  return `system=${r.json.data.system} · "${r.json.data.message.slice(0, 70)}…"`;
});

await step('INTERNAL continue x2 (multi-turn)', async () => {
  let r = await call('POST', '/specialty-history/continue', {
    token: state.patientToken,
    body: {
      consultationId: state.consultationId,
      patientMessage:
        'The pain started about two weeks ago. It feels like a heavy pressure in the middle of my chest when I walk up the hill to the taxi rank, and it goes away when I rest for a few minutes.',
    },
  });
  expect(r.status === 200 && r.json.data?.message, `turn1 status ${r.status}`);
  r = await call('POST', '/specialty-history/continue', {
    token: state.patientToken,
    body: {
      consultationId: state.consultationId,
      patientMessage:
        'Yes, sometimes it goes into my left arm. I sweat a bit when it happens. I smoke about 10 cigarettes a day and my father had a heart attack at 52. I also have high blood pressure but I stopped taking my pills 3 months ago.',
    },
  });
  expect(r.status === 200 && r.json.data?.message, `turn2 status ${r.status}`);
  state.redFlag = r.json.data.redFlagDetected;
  return `redFlagDetected=${state.redFlag}`;
});

await step('INTERNAL complete (structured extraction + encryption)', async () => {
  const r = await call('POST', '/specialty-history/complete', {
    token: state.patientToken,
    body: { consultationId: state.consultationId },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  const d = r.json.data;
  expect(d.department === 'INTERNAL', 'wrong department');
  expect(d.clinicalSummary?.length > 20, 'no clinical summary');
  expect(d.structuredHistory?.chiefComplaint, 'no structured chiefComplaint');
  state.urgency = d.urgency;
  return `system=${d.system} urgency=${d.urgency} redFlags=${d.redFlags?.length ?? 0} summary="${d.clinicalSummary.slice(0, 60)}…"`;
});

await step('dispatch: queue shows triaged, geo-scoped entry', async () => {
  const r = await call('GET', '/doctors/me/patient-queue', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}`);
  const queue = r.json.data?.queue ?? [];
  const entry = queue.find((q) => q.consultationId === state.consultationId);
  expect(entry, 'completed consultation not visible in nearby doctor queue');
  expect(entry.urgency === 'URGENT' || entry.urgency === 'EMERGENCY',
    `expected triage urgency stamped (URGENT/EMERGENCY for this cardiac case), got ${entry.urgency}`);
  expect(typeof entry.distanceKm === 'number', 'no doctor→patient distance in queue entry');
  return `urgency=${entry.urgency}, ${entry.distanceKm}km away, position ${queue.indexOf(entry) + 1}/${queue.length}`;
});

await step('doctor accepts dispatched consultation', async () => {
  const r = await call('POST', '/doctors/me/accept-patient', {
    token: state.doctorToken,
    body: { consultationId: state.consultationId },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
});

await step('stage investigation result (Troponin) before reasoning', async () => {
  const inv = await call('POST', '/investigations', {
    token: state.doctorToken,
    body: { consultationId: state.consultationId, type: 'LAB', name: 'Troponin I', urgency: 'STAT' },
  });
  expect(inv.status === 200 || inv.status === 201, `order status ${inv.status}: ${JSON.stringify(inv.json).slice(0, 200)}`);
  const invId = inv.json.data?.id ?? inv.json.data?.investigationId;
  expect(invId, `no investigation id: ${JSON.stringify(inv.json).slice(0, 200)}`);
  const res = await call('PUT', `/investigations/${invId}/result`, {
    token: state.doctorToken,
    body: { result: 'Troponin I ELEVATED at 2.3 ng/mL (ref <0.04) — consistent with myocardial injury' },
  });
  expect(res.status === 200, `result status ${res.status}: ${JSON.stringify(res.json).slice(0, 200)}`);
});

await step('specialty history readable by doctor (decrypted)', async () => {
  const r = await call('GET', `/specialty-history/${state.consultationId}`, {
    token: state.doctorToken,
  });
  expect(r.status === 200 && r.json.data?.clinicalSummary, `status ${r.status}`);
});

// ── Clinical reasoning + STG links ────────────────────────────────────────────
await step('clinical reasoning (differentials + STG links)', async () => {
  const r = await call('POST', `/clinical-reasoning/${state.consultationId}`, {
    token: state.doctorToken,
    body: {},
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  const d = r.json.data;
  expect(d.differentials?.length >= 3, `only ${d.differentials?.length} differentials`);
  const withReasoning = d.differentials.filter((x) => x.reasoning && x.supportingFeatures?.length);
  expect(withReasoning.length === d.differentials.length, 'differentials missing reasoning chains');
  const stgLinked = d.differentials.filter((x) => x.stg?.available);
  expect(stgLinked.length > 0, 'no differentials linked to an STG entry — STG dataset/linkage regression');
  expect((d.investigationsConsidered ?? 0) >= 1,
    `diagnostic loop open — reasoning consumed ${d.investigationsConsidered} investigation results (expected >=1 after staging troponin)`);
  expect(d.urgency === 'URGENT' || d.urgency === 'EMERGENCY', `expected urgency reconciled to at least URGENT for a red-flagged cardiac case, got ${d.urgency}`);
  state.reasoningTop = d.differentials[0];
  return `${d.differentials.length} differentials (top: ${d.differentials[0].diagnosis} ${d.differentials[0].probability}%), ${stgLinked.length} STG-linked, urgency=${d.urgency}, ${d.recommendedInvestigations?.length} investigations`;
});

await step('reasoning persisted for diagnosis flow', async () => {
  const r = await call('GET', `/diagnosis/${state.consultationId}`, { token: state.doctorToken });
  expect(r.status === 200 && r.json.data?.diagnoses?.length > 0, `status ${r.status}`);
  return `${r.json.data.diagnoses.length} stored`;
});

await step('ICD-10 spine: confirm diagnosis → coded problem list', async () => {
  const top = state.reasoningTop;
  expect(top?.icd10Code, 'top differential has no ICD-10 code');
  const sel = await call('PUT', `/diagnosis/${state.consultationId}/select`, {
    token: state.doctorToken,
    body: { selectedDiagnosis: top.diagnosis, icd10Code: top.icd10Code, notes: 'Confirmed after troponin review' },
  });
  expect(sel.status === 200, `select status ${sel.status}: ${JSON.stringify(sel.json).slice(0, 200)}`);

  const probs = await call('GET', '/patients/me/problems', { token: state.patientToken });
  expect(probs.status === 200, `problems status ${probs.status}`);
  const entry = (probs.json.data?.problems ?? []).find((p) => p.icd10Code === top.icd10Code);
  expect(entry, `confirmed ICD-10 ${top.icd10Code} not found in the patient problem list`);
  return `problem list has ${top.diagnosis} (${top.icd10Code}) [${entry.status}]`;
});

// ── Unified /analysis API: labs with critical-value flagging ─────────────────
await step('unified analysis: critical K+ flagged, triage escalated', async () => {
  const r = await call('POST', `/analysis/${state.consultationId}`, {
    token: state.doctorToken,
    body: {
      modality: 'LAB',
      name: 'U&E + Creatinine',
      clinicalQuestion: 'Renal function and electrolytes before starting treatment',
      reportText:
        'UREA & ELECTROLYTES\nSodium 138 mmol/L (136-145)\nPotassium 7.1 mmol/L (3.5-5.1) *H*\nChloride 101 mmol/L (98-107)\nUrea 21.4 mmol/L (2.1-7.1) *H*\nCreatinine 486 umol/L (64-104) *H*\neGFR 11 mL/min/1.73m2',
    },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  const d = r.json.data;
  expect(Array.isArray(d.values) && d.values.length >= 4, `only ${d.values?.length} analytes extracted`);
  const k = d.values.find((v) => /potassium|k\+/i.test(v.analyte));
  expect(k?.flag === 'CRITICAL', `K+ 7.1 flagged ${k?.flag}, expected CRITICAL`);
  expect(d.criticalFindings?.length >= 1, 'no critical findings surfaced for K+ 7.1 with AKI');
  expect(d.urgency === 'URGENT' || d.urgency === 'EMERGENCY', `urgency=${d.urgency}`);
  expect(d.investigationId, 'analysis not persisted as an investigation');
  return `${d.values.length} analytes, K+=${k.flag}, urgency=${d.urgency}, triageEscalated=${d.triageEscalated}`;
});

await step('unified analysis: stored + listed, feeds reasoning loop', async () => {
  const list = await call('GET', `/analysis/${state.consultationId}`, { token: state.doctorToken });
  expect(list.status === 200 && list.json.data?.count >= 1, `list status ${list.status}, count=${list.json.data?.count}`);
  const stored = list.json.data.analyses[0];
  expect(stored.impression?.length > 10, 'stored analysis has no impression');

  // The analysis persists into the same Investigation envelope the reasoning
  // loop consumes — a fresh reasoning pass must now see >= 2 results
  // (troponin + this panel).
  const r = await call('POST', `/clinical-reasoning/${state.consultationId}`, {
    token: state.doctorToken,
    body: {},
  });
  expect(r.status === 200, `reasoning status ${r.status}`);
  expect((r.json.data?.investigationsConsidered ?? 0) >= 2,
    `reasoning consumed ${r.json.data?.investigationsConsidered} results, expected >=2 after unified analysis`);
  return `listed ${list.json.data.count} analyses; reasoning now weighs ${r.json.data.investigationsConsidered} results`;
});

// ── C3: prescription safety gate + STG-driven management draft ───────────────
await step('safety gate: warfarin+NSAID blocked with 409', async () => {
  const script = {
    consultationId: state.consultationId,
    items: [
      { medication: 'Warfarin', dose: '5mg', route: 'Oral', frequency: 'daily', duration: '30 days', quantity: 30, instructions: 'Take at the same time daily', isScheduled: false },
      { medication: 'Ibuprofen', dose: '400mg', route: 'Oral', frequency: '8 hourly', duration: '5 days', quantity: 15, instructions: 'Take with food', isScheduled: false },
    ],
  };
  const r = await call('POST', '/prescriptions', { token: state.doctorToken, body: script });
  expect(r.status === 409, `expected 409 SAFETY_WARNINGS, got ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.code === 'SAFETY_WARNINGS', `code=${r.json.code}`);
  const interaction = (r.json.warnings ?? []).find((w) => w.category === 'INTERACTION');
  expect(interaction, `no INTERACTION warning in ${JSON.stringify(r.json.warnings).slice(0, 200)}`);
  state.blockedScript = script;
  return `${r.json.warnings.length} warning(s): "${interaction.reason}"`;
});

await step('safety gate: conscious override issues script + audit trail', async () => {
  const r = await call('POST', '/prescriptions', {
    token: state.doctorToken,
    body: { ...state.blockedScript, overrideSafetyWarnings: true },
  });
  expect(r.status === 201, `override status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.scriptNumber, 'no script number returned');
  return `script ${r.json.data.scriptNumber} issued under override`;
});

await step('management draft: STG-adapted plan from confirmed ICD-10', async () => {
  const r = await call('POST', `/management/draft/${state.consultationId}`, {
    token: state.doctorToken,
    body: {},
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  const d = r.json.data;
  expect(d.icd10Code === state.reasoningTop.icd10Code, `draft coded ${d.icd10Code}, expected ${state.reasoningTop.icd10Code}`);
  expect(d.medications?.length >= 1, 'draft has no medications');
  expect(d.patientInstructions?.length > 20, 'no patient instructions');
  expect(Array.isArray(d.safetyWarnings), 'draft not pre-screened through the safety gate');
  return `${d.medications.length} meds, ${d.investigations?.length ?? 0} ix, follow-up ${d.followUpDays}d, STG: ${d.stgSource ?? 'none (AI fallback)'}, ${d.safetyWarnings.length} safety warnings`;
});

// ── O&G history (separate AI API) ─────────────────────────────────────────────
await step('O&G start (gynae mode detection)', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  state.ogConsultationId = c.json.data?.consultationId ?? c.json.data?.id;
  const r = await call('POST', '/og-history/start', {
    token: state.patientToken,
    body: {
      consultationId: state.ogConsultationId,
      language: 'en',
      chiefComplaint: 'very heavy painful periods for the last 6 months',
    },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.mode === 'GYNAECOLOGICAL', `mode=${r.json.data?.mode}`);
  return `mode=${r.json.data.mode} · "${r.json.data.message.slice(0, 60)}…"`;
});

await step('O&G continue + complete', async () => {
  const r = await call('POST', '/og-history/continue', {
    token: state.patientToken,
    body: {
      consultationId: state.ogConsultationId,
      patientMessage:
        'My last period started 10 days ago and lasted 8 days, very heavy with clots — I soak a pad every 2 hours. My cycles are every 26 days. I am not on any contraception and my last pap smear was 4 years ago.',
    },
  });
  expect(r.status === 200 && r.json.data?.message, `continue status ${r.status}`);
  const done = await call('POST', '/og-history/complete', {
    token: state.patientToken,
    body: { consultationId: state.ogConsultationId },
  });
  expect(done.status === 200, `complete status ${done.status}`);
  const d = done.json.data;
  expect(d.gynaeHistory?.menstrualHistory, 'no structured gynae history');
  return `urgency=${d.urgency} · menstrual="${String(d.gynaeHistory.menstrualHistory).slice(0, 50)}…"`;
});

// ── Psychiatry (risk-first framework) ─────────────────────────────────────────
await step('PSYCHIATRY start (gentle risk-first opening)', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  state.psychConsultationId = c.json.data?.consultationId ?? c.json.data?.id;
  const r = await call('POST', '/specialty-history/start', {
    token: state.patientToken,
    body: {
      consultationId: state.psychConsultationId,
      department: 'PSYCHIATRY',
      language: 'en',
      chiefComplaint: 'feeling very low and not sleeping for weeks',
    },
  });
  expect(r.status === 200 && r.json.data?.message, `status ${r.status}`);
  return `"${r.json.data.message.slice(0, 80)}…"`;
});

// ── General adaptive history (primary flow) ───────────────────────────────────
await step('general AI history start (adaptive engine)', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  state.genConsultationId = c.json.data?.consultationId ?? c.json.data?.id;
  const r = await call('POST', '/ai-history/start', {
    token: state.patientToken,
    body: { consultationId: state.genConsultationId, language: 'en' },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  expect(r.json.data?.message?.length > 10, 'no opening message');
  return `"${r.json.data.message.slice(0, 70)}…"`;
});

// ── Document generation from confirmed diagnosis ──────────────────────────────
await step('sick note generation (AI document)', async () => {
  const r = await call('POST', '/doctor/documents/sick-note', {
    token: state.doctorToken,
    body: {
      patientName: 'Sipho Ndlovu',
      doctorName: 'Dr Annelie van Wyk',
      doctorHpcsa: 'MP0123456',
      practiceName: 'Van Wyk Family Practice',
      diagnosisText: state.reasoningTop?.diagnosis ?? 'Acute coronary syndrome workup',
      dateOfConsultation: '2026-07-02',
      unfitFromDate: '2026-07-02',
      unfitToDate: '2026-07-04',
      daysOff: 3,
    },
  });
  expect(r.status === 200 || r.status === 201, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  return 'generated from confirmed diagnosis';
});

console.log(`\n=== AI paths: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
