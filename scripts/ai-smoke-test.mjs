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
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  state.consultationId = c.json.data?.id ?? c.json.data?.consultationId;
  expect(state.consultationId, 'no consultation');
  await call('POST', '/doctors/me/accept-patient', {
    token: state.doctorToken,
    body: { consultationId: state.consultationId },
  });
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
  expect(d.urgency === 'URGENT' || d.urgency === 'EMERGENCY', `expected urgency reconciled to at least URGENT for a red-flagged cardiac case, got ${d.urgency}`);
  state.reasoningTop = d.differentials[0];
  return `${d.differentials.length} differentials (top: ${d.differentials[0].diagnosis} ${d.differentials[0].probability}%), ${stgLinked.length} STG-linked, urgency=${d.urgency}, ${d.recommendedInvestigations?.length} investigations`;
});

await step('reasoning persisted for diagnosis flow', async () => {
  const r = await call('GET', `/diagnosis/${state.consultationId}`, { token: state.doctorToken });
  expect(r.status === 200 && r.json.data?.diagnoses?.length > 0, `status ${r.status}`);
  return `${r.json.data.diagnoses.length} stored`;
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
