// End-to-end smoke test against the local MedAI API.
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

// ── Auth ──────────────────────────────────────────────────────────────────────
await step('patient login', async () => {
  const r = await call('POST', '/auth/login', {
    body: { email: 'patient@example.com', password: 'Patient@1234' },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 150)}`);
  expect(r.json.data?.accessToken, 'no accessToken');
  state.patientToken = r.json.data.accessToken;
  state.patientRefresh = r.json.data.refreshToken;
});

await step('doctor login', async () => {
  const r = await call('POST', '/auth/login', {
    body: { email: 'dr.van-wyk@example.com', password: 'Doctor@1234' },
  });
  expect(r.status === 200, `status ${r.status}`);
  state.doctorToken = r.json.data.accessToken;
});

await step('GET /auth/me (patient, nested profile)', async () => {
  const r = await call('GET', '/auth/me', { token: state.patientToken });
  expect(r.status === 200, `status ${r.status}`);
  expect(r.json.data?.user?.patient?.firstName, 'no nested patient profile');
  return `patient=${r.json.data.user.patient.firstName}`;
});

await step('token refresh', async () => {
  const r = await call('POST', '/auth/refresh', { body: { refreshToken: state.patientRefresh } });
  expect(r.status === 200 && r.json.data?.accessToken, `status ${r.status}`);
});

await step('forgot-password (dev returns OTP)', async () => {
  const r = await call('POST', '/auth/forgot-password', { body: { phone: '+27821234567' } });
  expect(r.status === 200, `status ${r.status}`);
  state.resetOtp = r.json.data?.otp;
  return state.resetOtp ? 'otp received' : 'accepted';
});

// ── Doctor profile & availability ─────────────────────────────────────────────
await step('GET /doctors/me', async () => {
  const r = await call('GET', '/doctors/me', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 150)}`);
  state.doctorId = r.json.data?.id ?? r.json.data?.doctor?.id;
  return `id=${String(state.doctorId).slice(0, 8)}…`;
});

await step('PUT /doctors/availability (go online)', async () => {
  const r = await call('PUT', '/doctors/availability', {
    token: state.doctorToken,
    body: { isAvailable: true, lat: -26.2041, lng: 28.0473, radius: 15 },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 150)}`);
});

await step('GET /doctors/nearby', async () => {
  const r = await call('GET', '/doctors/nearby?lat=-26.2&lng=28.05&radiusKm=25', {
    token: state.patientToken,
  });
  expect(r.status === 200, `status ${r.status}`);
  const list = r.json.data?.doctors ?? r.json.data ?? [];
  expect(Array.isArray(list) && list.length > 0, `no doctors returned: ${JSON.stringify(r.json).slice(0, 200)}`);
  state.nearbyDoctorId = list[0].id;
  return `${list.length} doctor(s)`;
});

await step('GET /hpcsa/status (doctor)', async () => {
  const r = await call('GET', '/hpcsa/status', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}`);
  return r.json.data?.hpcsaStatus;
});

// ── Consultation flow ─────────────────────────────────────────────────────────
await step('POST /consultations (patient, assigned doctor)', async () => {
  const r = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.nearbyDoctorId },
  });
  expect(r.status === 201 || r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  state.consultationId = r.json.data?.id ?? r.json.data?.consultationId;
  expect(state.consultationId, 'no consultation id');
  return `id=${String(state.consultationId).slice(0, 8)}…`;
});

await step('GET /consultations/:id (patient)', async () => {
  const r = await call('GET', `/consultations/${state.consultationId}`, { token: state.patientToken });
  expect(r.status === 200 && r.json.data?.status, `status ${r.status}`);
  return r.json.data.status;
});

await step('GET /specialty-history/departments', async () => {
  const r = await call('GET', '/specialty-history/departments');
  expect(r.status === 200 && r.json.data?.length === 6, `got ${r.json.data?.length} departments`);
  return r.json.data.map((d) => d.key).join(',');
});

await step('POST /specialty-history/start (AI — placeholder key)', async () => {
  const r = await call('POST', '/specialty-history/start', {
    token: state.patientToken,
    body: { consultationId: state.consultationId, department: 'INTERNAL', language: 'en', chiefComplaint: 'chest pain' },
  });
  // With a placeholder key this should fail gracefully (401 from Anthropic → 500 here), not crash
  expect(r.status === 200 || r.status === 502, `status ${r.status}`);
  return r.status === 200 ? 'AI LIVE' : 'graceful failure without real key (expected)';
});

// ── Doctor queue ──────────────────────────────────────────────────────────────
await step('GET /doctors/me/patient-queue', async () => {
  const r = await call('GET', '/doctors/me/patient-queue', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}`);
  const q = r.json.data?.queue ?? r.json.data ?? [];
  return `${Array.isArray(q) ? q.length : '?'} waiting`;
});

await step('POST /doctors/me/accept-patient', async () => {
  const r = await call('POST', '/doctors/me/accept-patient', {
    token: state.doctorToken,
    body: { consultationId: state.consultationId },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
});

// ── Payments ──────────────────────────────────────────────────────────────────
await step('POST /payments/initiate', async () => {
  const r = await call('POST', '/payments/initiate', {
    token: state.patientToken,
    body: { consultationId: state.consultationId },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.paymentUrl?.includes('payfast'), 'no payfast url');
  return `R${r.json.data.amount} → sandbox url OK`;
});

await step('GET /payments/status/:id', async () => {
  const r = await call('GET', `/payments/status/${state.consultationId}`, { token: state.patientToken });
  expect(r.status === 200, `status ${r.status}`);
  return r.json.data?.status;
});

await step('POST /payments/cash/:id (doctor marks cash)', async () => {
  const r = await call('POST', `/payments/cash/${state.consultationId}`, { token: state.doctorToken, body: {} });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
});

// ── Clinical workflow (doctor) ────────────────────────────────────────────────
await step('PUT /consultations/:id/status → EXAMINATION', async () => {
  const r = await call('PUT', `/consultations/${state.consultationId}/status`, {
    token: state.doctorToken,
    body: { status: 'EXAMINATION' },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
});

await step('POST /consultations/:id/examination', async () => {
  const r = await call('POST', `/consultations/${state.consultationId}/examination`, {
    token: state.doctorToken,
    body: {
      vitalSigns: { bloodPressureSystolic: 128, bloodPressureDiastolic: 82, heartRate: 76, temperature: 36.8, oxygenSaturation: 98 },
      generalExamination: { generalAppearance: 'Well, not in distress' },
      systemicExamination: { cardiovascular: 'Normal S1S2, no murmurs', respiratory: 'Clear bilaterally' },
    },
  });
  expect(r.status === 200 || r.status === 201, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
});

await step('POST /consultations/:id/management', async () => {
  const r = await call('POST', `/consultations/${state.consultationId}/management`, {
    token: state.doctorToken,
    body: {
      diagnosis: 'Musculoskeletal chest pain',
      medications: [{ name: 'Ibuprofen', dose: '400mg', frequency: '8-hourly', duration: '5 days', route: 'oral' }],
      followUpDays: 7,
      patientInstructions: 'Return if pain worsens or new shortness of breath.',
    },
  });
  expect(r.status === 200 || r.status === 201, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
});

await step('GET /consultations/:id/management (decrypts + followUpDays)', async () => {
  const r = await call('GET', `/consultations/${state.consultationId}/management`, { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.diagnosis === 'Musculoskeletal chest pain', 'diagnosis roundtrip failed');
  expect(r.json.data?.followUpDays === 7, `followUpDays=${r.json.data?.followUpDays}`);
  return 'encrypt/decrypt roundtrip OK';
});

// ── STG (static dataset) ──────────────────────────────────────────────────────
await step('GET /stg/search?q=pneumonia', async () => {
  const r = await call('GET', '/stg/search?q=pneumonia', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}`);
  const entries = r.json.data?.results ?? r.json.data?.entries ?? [];
  expect(entries.length > 0, 'no STG entries');
  return `${entries.length} entr(ies)`;
});

await step('GET /stg/categories', async () => {
  const r = await call('GET', '/stg/categories', { token: state.doctorToken });
  expect(r.status === 200, `status ${r.status}`);
});

// ── Emergency profile ─────────────────────────────────────────────────────────
await step('PUT /emergency/my-profile', async () => {
  const r = await call('PUT', '/emergency/my-profile', {
    token: state.patientToken,
    body: { bloodType: 'O+', allergies: 'Penicillin — rash', conditions: 'Asthma', emergencyContacts: [{ name: 'Thabo M', phone: '+27821110000', relationship: 'brother' }] },
  });
  expect(r.status === 200, `status ${r.status}: ${JSON.stringify(r.json).slice(0, 300)}`);
});

await step('GET /emergency/my-profile', async () => {
  const r = await call('GET', '/emergency/my-profile', { token: state.patientToken });
  expect(r.status === 200, `status ${r.status}`);
});

// ── Access control checks ─────────────────────────────────────────────────────
await step('patient CANNOT read another consultation (403/404 on bogus id)', async () => {
  const r = await call('GET', '/consultations/nonexistent-id', { token: state.patientToken });
  expect(r.status === 403 || r.status === 404, `status ${r.status}`);
});

await step('no token → 401', async () => {
  const r = await call('GET', '/patients/me');
  expect(r.status === 401, `status ${r.status}`);
});

await step('patient cannot call doctor-only route', async () => {
  const r = await call('POST', `/clinical-reasoning/${state.consultationId}`, { token: state.patientToken, body: {} });
  expect(r.status === 403, `status ${r.status}`);
});

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
