// Payment enforcement smoke test — run against an API started with
// PAYMENT_ENFORCEMENT=true. Proves the marketplace billing gate:
//   - completion + prescriptions 402 while unpaid
//   - PayFast initiate leaves it PENDING (still blocked)
//   - cash/medical-aid marking clears the gate
//   - EMERGENCY triage is exempt (billing never blocks emergency care)
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

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

await step('setup: logins, fee set, consultation created', async () => {
  const p = await call('POST', '/auth/login', { body: { email: 'patient@example.com', password: 'Patient@1234' } });
  state.patientToken = p.json.data.accessToken;
  const d = await call('POST', '/auth/login', { body: { email: 'dr.van-wyk@example.com', password: 'Doctor@1234' } });
  state.doctorToken = d.json.data.accessToken;
  const me = await call('GET', '/doctors/me', { token: state.doctorToken });
  state.doctorId = me.json.data?.id ?? me.json.data?.doctor?.id;

  const fee = await call('PUT', '/doctors/me', { token: state.doctorToken, body: { consultationFee: 450 } });
  expect(fee.status === 200, `fee update status ${fee.status}: ${JSON.stringify(fee.json).slice(0, 200)}`);

  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  state.consultationId = c.json.data?.id ?? c.json.data?.consultationId;
  expect(state.consultationId, 'no consultation created');
  return `fee R450, consultation ${String(state.consultationId).slice(0, 8)}…`;
});

await step('unpaid: consultation completion blocked with 402', async () => {
  const r = await call('POST', `/consultations/${state.consultationId}/complete`, { token: state.doctorToken });
  expect(r.status === 402, `expected 402, got ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.code === 'PAYMENT_REQUIRED', `code=${r.json.code}`);
  expect(r.json.payment?.amountDue === 450, `amountDue=${r.json.payment?.amountDue}`);
  return `402 PAYMENT_REQUIRED, R${r.json.payment.amountDue} due, status=${r.json.payment.status}`;
});

await step('unpaid: prescription issuance blocked with 402', async () => {
  const r = await call('POST', '/prescriptions', {
    token: state.doctorToken,
    body: {
      consultationId: state.consultationId,
      items: [{ medication: 'Paracetamol', dose: '1g', route: 'Oral', frequency: '6 hourly PRN', duration: '5 days', quantity: 20, instructions: 'Max 4g/day', isScheduled: false }],
    },
  });
  expect(r.status === 402, `expected 402, got ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.code === 'PAYMENT_REQUIRED', `code=${r.json.code}`);
});

await step('PayFast initiate returns payment URL, gate still closed', async () => {
  const r = await call('POST', '/payments/initiate', {
    token: state.patientToken,
    body: { consultationId: state.consultationId },
  });
  expect(r.status === 200, `initiate status ${r.status}: ${JSON.stringify(r.json).slice(0, 200)}`);
  expect(r.json.data?.paymentUrl?.includes('payfast'), 'no PayFast URL');
  const blocked = await call('POST', `/consultations/${state.consultationId}/complete`, { token: state.doctorToken });
  expect(blocked.status === 402, `PENDING payment must still block, got ${blocked.status}`);
  expect(blocked.json.payment?.status === 'PENDING', `payment status=${blocked.json.payment?.status}`);
  return `paymentUrl issued, completion still 402 while PENDING`;
});

await step('cash payment recorded → prescription + completion unlock', async () => {
  const cash = await call('POST', `/payments/cash/${state.consultationId}`, { token: state.doctorToken });
  expect(cash.status === 200, `cash status ${cash.status}: ${JSON.stringify(cash.json).slice(0, 200)}`);

  const rx = await call('POST', '/prescriptions', {
    token: state.doctorToken,
    body: {
      consultationId: state.consultationId,
      items: [{ medication: 'Paracetamol', dose: '1g', route: 'Oral', frequency: '6 hourly PRN', duration: '5 days', quantity: 20, instructions: 'Max 4g/day', isScheduled: false }],
    },
  });
  expect(rx.status === 201, `prescription after payment: ${rx.status}: ${JSON.stringify(rx.json).slice(0, 200)}`);

  const done = await call('POST', `/consultations/${state.consultationId}/complete`, { token: state.doctorToken });
  expect(done.status === 200, `completion after payment: ${done.status}: ${JSON.stringify(done.json).slice(0, 200)}`);
  return `script ${rx.json.data.scriptNumber} issued, consultation COMPLETED`;
});

await step('EMERGENCY triage exempt — care is never billing-blocked', async () => {
  const c = await call('POST', '/consultations', {
    token: state.patientToken,
    body: { language: 'en', consultationType: 'IN_PERSON', doctorId: state.doctorId },
  });
  const emergencyId = c.json.data?.id ?? c.json.data?.consultationId;
  expect(emergencyId, 'no consultation created');

  // Stamp EMERGENCY triage directly (in production the AI history/red-flag
  // pipeline stamps this) — the gate must exempt it with payment outstanding.
  const envText = readFileSync(new URL('../apps/api/.env', import.meta.url), 'utf8');
  const dbUrl = envText.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1];
  expect(dbUrl, 'DATABASE_URL not found in apps/api/.env');
  const require = createRequire(new URL('../apps/api/package.json', import.meta.url));
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  try {
    await prisma.consultation.update({
      where: { id: emergencyId },
      data: { triageUrgency: 'EMERGENCY' },
    });
  } finally {
    await prisma.$disconnect();
  }

  const done = await call('POST', `/consultations/${emergencyId}/complete`, { token: state.doctorToken });
  expect(done.status === 200, `EMERGENCY completion should bypass the gate, got ${done.status}: ${JSON.stringify(done.json).slice(0, 200)}`);
  return 'unpaid EMERGENCY consultation completed without a 402';
});

console.log(`\n=== Payment enforcement: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
