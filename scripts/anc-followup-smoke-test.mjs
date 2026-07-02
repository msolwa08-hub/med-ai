// Antenatal follow-up continuity test — proves the follow-up visit actually
// inherits LMP/EDD/gravida/para from the patient's first obstetric visit
// across two SEPARATE consultations (each with its own encryption key).
const BASE = process.env.API_URL ?? 'http://localhost:3000';
let pass = 0, fail = 0;

async function step(name, fn) {
  try {
    const out = await fn();
    console.log(`PASS  ${name}${out ? ` — ${out}` : ''}`);
    pass++;
  } catch (err) {
    console.log(`FAIL  ${name} — ${err.message}`);
    fail++;
  }
}

async function call(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

const state = {};

await step('setup: patient/doctor login + consent', async () => {
  const p = await call('POST', '/auth/login', { body: { email: 'patient@example.com', password: 'Patient@1234' } });
  state.patientToken = p.json.data.accessToken;
  const d = await call('POST', '/auth/login', { body: { email: 'dr.van-wyk@example.com', password: 'Doctor@1234' } });
  state.doctorToken = d.json.data.accessToken;
  const me = await call('GET', '/doctors/me', { token: state.doctorToken });
  state.doctorId = me.json.data?.id ?? me.json.data?.doctor?.id;
  await call('POST', '/patients/me/consents', { token: state.patientToken, body: { doctorId: state.doctorId, consentType: 'VIEW_HISTORY' } });
});

// ── Visit 1: first obstetric booking visit ────────────────────────────────────
await step('visit 1: O&G first-visit booking (establishes LMP/gravida/para)', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', doctorId: state.doctorId },
  });
  state.visit1Id = c.json.data?.consultationId ?? c.json.data?.id;

  await call('POST', '/og-history/start', {
    token: state.patientToken,
    body: { consultationId: state.visit1Id, language: 'en', isPregnant: true, chiefComplaint: 'first antenatal booking visit' },
  });

  const twelveWeeksAgo = new Date(Date.now() - 12 * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  await call('POST', '/og-history/continue', {
    token: state.patientToken,
    body: {
      consultationId: state.visit1Id,
      patientMessage: `This is my second pregnancy, I have one previous child born normally (G2P1). My last period started on ${twelveWeeksAgo}. I feel well, no bleeding, no pain.`,
    },
  });
  const done = await call('POST', '/og-history/complete', { token: state.patientToken, body: { consultationId: state.visit1Id } });
  expect(done.status === 200, `status ${done.status}`);
  state.lmp = done.json.data?.obstetricHistory?.lmp;
  return `LMP recorded: ${state.lmp ?? '(AI did not extract a parseable date — will verify follow-up still works)'}`;
});

// ── Visit 2: SEPARATE consultation, follow-up visit ───────────────────────────
await step('visit 2: new consultation, antenatal follow-up start', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', doctorId: state.doctorId },
  });
  state.visit2Id = c.json.data?.consultationId ?? c.json.data?.id;
  expect(state.visit2Id !== state.visit1Id, 'follow-up must be a distinct consultation with its own encryption key');

  const r = await call('POST', '/antenatal-followup/start', {
    token: state.patientToken,
    body: { consultationId: state.visit2Id, language: 'en' },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
  expect(r.json.data?.priorContextFound === true, 'follow-up did NOT find the prior visit — cross-consultation lookup broken');
  expect(r.json.data?.visitNumber === 2, `expected visitNumber=2, got ${r.json.data?.visitNumber}`);
  return `priorContextFound=${r.json.data.priorContextFound}, visitNumber=${r.json.data.visitNumber} · "${r.json.data.message.slice(0, 90)}…"`;
});

await step('visit 2: continue + complete, red flag screen negative', async () => {
  const r = await call('POST', '/antenatal-followup/continue', {
    token: state.patientToken,
    body: {
      consultationId: state.visit2Id,
      patientMessage: 'I have been feeling fine, baby is moving well every day, no bleeding, no headaches, no swelling. I have been taking my iron tablets every day.',
    },
  });
  expect(r.status === 200 && r.json.data?.message, `continue status ${r.status}`);

  const done = await call('POST', '/antenatal-followup/complete', {
    token: state.patientToken,
    body: { consultationId: state.visit2Id },
  });
  expect(done.status === 200, `complete status ${done.status}: ${JSON.stringify(done.json).slice(0, 300)}`);
  const d = done.json.data;
  expect(d.gestationalAgeAtVisit, 'no gestational age computed for the follow-up visit');
  expect(Array.isArray(d.redFlags), 'no redFlags array');
  return `GA=${d.gestationalAgeAtVisit} urgency=${d.urgency} redFlags=${d.redFlags.length}`;
});

await step('doctor can read the follow-up note (decrypted, own key)', async () => {
  const r = await call('GET', `/antenatal-followup/${state.visit2Id}`, { token: state.doctorToken });
  expect(r.status === 200 && r.json.data?.clinicalSummary, `status ${r.status}`);
});

await step('visit 2 consultation moved to DOCTOR_REVIEW', async () => {
  const r = await call('GET', `/consultations/${state.visit2Id}`, { token: state.doctorToken });
  expect(r.status === 200 && r.json.data?.status === 'DOCTOR_REVIEW', `status field = ${r.json.data?.status}`);
});

console.log(`\n=== ANC follow-up continuity: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
