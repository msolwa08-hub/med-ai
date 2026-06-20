/**
 * full-infra-test.mjs — end-to-end live test of the whole MedAI infrastructure
 * against a running beta server. Drives: patient history-taker -> doctor cockpit
 * (exam -> clinical package -> sign) -> intern tools (discharge/referral/ward).
 *
 * Env: BASE (server url), ANTHROPIC_API_KEY (for the patient simulator),
 *      PT_KEY, DOC_KEY, TOOLS_KEY (defaults match the server start command).
 */
import Anthropic from "@anthropic-ai/sdk";

const BASE = process.env.BASE || "http://localhost:4401";
const PT_KEY = process.env.PT_KEY || "PT";
const DOC_KEY = process.env.DOC_KEY || "DOC";
const TOOLS_KEY = process.env.TOOLS_KEY || "TOOLS";
const client = new Anthropic();
const PATIENT_MODEL = "claude-haiku-4-5-20251001";

const C = { r: "\x1b[0m", g: "\x1b[32m", red: "\x1b[31m", y: "\x1b[33m", c: "\x1b[36m", b: "\x1b[1m", grey: "\x1b[90m" };
const results = [];
function step(name, pass, detail = "") {
  results.push({ name, pass });
  console.log(`  ${pass ? C.g + "✓" : C.red + "✗"} ${name}${C.r}${detail ? `  ${C.grey}${detail}${C.r}` : ""}`);
}

async function api(method, path, body, headers = {}) {
  const h = { ...headers };
  if (body) h["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok && json.success, data: json.data, error: json.error };
}

// Patient simulator (UTI persona, cooperative + terse to keep it short)
const PERSONA = `You are roleplaying a PATIENT: a 30-year-old woman. For 2 days you've had burning when you pass urine and you're going more often, with mild lower-tummy discomfort. No fever, no back pain, no blood in urine. Not pregnant, last period 2 weeks ago. No allergies, no regular medicines, no chronic conditions. HIV negative (tested last year). No TB contacts. Non-smoker, occasional wine. You sleep ok, mood fine, you walk for exercise. Answer ONLY what you are asked, in one short natural sentence. Do not volunteer extra. Never break character.`;
const patientMsgs = [];
async function patientSay(medaiText) {
  patientMsgs.push({ role: "user", content: medaiText });
  const r = await client.messages.create({ model: PATIENT_MODEL, max_tokens: 120, system: PERSONA, messages: patientMsgs });
  const t = r.content[0].type === "text" ? r.content[0].text : "ok";
  patientMsgs.push({ role: "assistant", content: t });
  return t;
}

async function run() {
  console.log(`${C.b}${C.c}MedAI — full infrastructure live test${C.r}  ${C.grey}(${BASE})${C.r}\n`);

  // ── 0. Health ───────────────────────────────────────────────────────────
  const health = await api("GET", "/health");
  step("Health check", health.status === 200 && health.data?.status === undefined ? true : health.ok || health.status === 200, `status ${health.status}`);

  // ── 1. Patient history-taker ────────────────────────────────────────────
  console.log(`\n${C.b}1. Patient history-taker${C.r}`);
  const val = await api("POST", "/beta/validate", { accessKey: PT_KEY });
  step("Patient access-key validates", val.ok && val.data.valid === true);
  const start = await api("POST", "/beta/session/start", { accessKey: PT_KEY });
  step("Session starts (AI opener)", start.ok && !!start.data.sessionId, start.data?.message?.slice(0, 60) + "…");
  const sessionId = start.data?.sessionId;

  let reply = start.data?.message ?? "";
  let complete = false, summary = null, turns = 0;
  const MAX = 9;
  for (let t = 0; t < MAX && sessionId; t++) {
    const msg = t === MAX - 1 ? "That's everything, thank you — I need to go now." : await patientSay(reply);
    const r = await api("POST", "/beta/session/message", { sessionId, message: msg });
    if (!r.ok) { step("Conversation turn failed", false, r.error); break; }
    reply = r.data.reply; complete = r.data.isComplete; if (r.data.summary) summary = r.data.summary;
    turns++;
    if (complete) break;
  }
  step("History completes + summary generated", complete && !!summary, `${turns} turns, summary ${summary?.length ?? 0} chars`);

  // ── 2. Doctor cockpit ───────────────────────────────────────────────────
  console.log(`\n${C.b}2. Doctor cockpit${C.r}`);
  const dval = await api("POST", "/cockpit/validate", { doctorKey: DOC_KEY });
  step("Doctor key validates", dval.ok && dval.data.valid === true);
  const noAuth = await api("GET", "/cockpit/consults");
  step("Cockpit rejects missing key (401)", noAuth.status === 401);
  const list = await api("GET", "/cockpit/consults", null, { "x-doctor-key": DOC_KEY });
  const found = list.data?.consults?.find((c) => c.sessionId === sessionId);
  step("Consult appears in cockpit list", !!found, found ? `status ${found.consultStatus}` : "not found");
  const detail = await api("GET", `/cockpit/consults/${sessionId}`, null, { "x-doctor-key": DOC_KEY });
  step("Consult detail (history + summary)", detail.ok && !!detail.data.summary);
  const exam = await api("POST", `/cockpit/consults/${sessionId}/exam`, {
    vitals: { temperature: "36.8", heartRate: "78", bloodPressure: "118/76" },
    generalInspection: "Well, afebrile, comfortable",
    systemFindings: "Abdomen soft, mild suprapubic tenderness, no loin tenderness. Urine dip: leucocytes ++, nitrites +.",
  }, { "x-doctor-key": DOC_KEY });
  step("Save examination findings", exam.ok);
  const pkg = await api("POST", `/cockpit/consults/${sessionId}/package`, null, { "x-doctor-key": DOC_KEY });
  const P = pkg.data?.package;
  const topDx = P?.differentials?.[0];
  step("Generate clinical package", pkg.ok && P?.differentials?.length > 0,
    topDx ? `${P.differentials.length} dx · top: ${topDx.diagnosis} (${topDx.icd10Code}) ${topDx.probability}%` : "");
  step("Package has draft script", pkg.ok && Array.isArray(P?.prescriptionDraft), `${P?.prescriptionDraft?.length ?? 0} item(s)`);
  if (P) {
    const conf = await api("POST", `/cockpit/consults/${sessionId}/confirm`, { package: P }, { "x-doctor-key": DOC_KEY });
    step("Confirm & sign package", conf.ok && conf.data.consultStatus === "SIGNED", `status ${conf.data?.consultStatus}`);
  } else step("Confirm & sign package", false, "no package");

  // ── 3. Intern tools (across specialties) ────────────────────────────────
  console.log(`\n${C.b}3. Intern tools — across specialties${C.r}`);
  const tval = await api("POST", "/tools/validate", { toolsKey: TOOLS_KEY });
  step("Tools key validates", tval.ok && tval.data.valid === true);
  const tNoAuth = await api("POST", "/tools/discharge", { notes: "x" });
  step("Tools reject missing key (401)", tNoAuth.status === 401);

  const disc = await api("POST", "/tools/discharge", {
    specialty: "Paediatrics", ageSex: "3yo M, 14kg", ward: "Paeds Ward",
    admissionDate: "2026-06-17", dischargeDate: "2026-06-20",
    notes: "3yo boy, 14kg, admitted with acute gastroenteritis and moderate dehydration. Vomiting + watery diarrhoea x2 days. Started on IV maintenance + rehydration, ondansetron once, oral rehydration once tolerating. No blood in stool, no fever now. Improved, tolerating orals, passing urine. Mother counselled on ORS. Discharge home.",
  }, { "x-tools-key": TOOLS_KEY });
  const D = disc.data?.document;
  step("Discharge summary (Paeds)", disc.ok && Array.isArray(D?.dischargeDiagnoses),
    D ? `${D.dischargeDiagnoses.length} dx · ${D.dischargeMedications.length} med(s)` : disc.error);

  const ref = await api("POST", "/tools/referral", {
    specialty: "Obstetrics & Gynaecology", ageSex: "58F", referTo: "Gynaecology",
    urgency: "URGENT", specificQuestion: "Postmenopausal bleeding — please assess for endometrial pathology.",
    notes: "58yo woman, menopause age 51, now with 3 weeks of intermittent vaginal bleeding. Not on HRT. O/E: abdomen soft, speculum shows blood from os, no visible cervical lesion. Needs TVUS + endometrial assessment.",
  }, { "x-tools-key": TOOLS_KEY });
  const R = ref.data?.document;
  step("Referral letter (O&G)", ref.ok && !!R?.reasonForReferral, R ? `to ${R.to.specialty} · ${R.urgency}` : ref.error);

  const wn = await api("POST", "/tools/ward-note", {
    specialty: "General / Internal Medicine", ageSex: "67F", ward: "Medical Ward", hospitalDay: "Day 3",
    workingDiagnosis: "Community-acquired pneumonia",
    previousNotes: "Day1: Admitted CAP, started IV ceftriaxone + oral azithromycin, O2 2L. Day2: Afebrile, sats improving on 1L.",
    labResults: "Day1: WCC 15.1, CRP 210, Cr 70, Na 134. Day2: WCC 12.0, CRP 150, Cr 68. Day3: WCC 9.8, CRP 90, Cr 66, Na 137.",
    todayStatus: "Day3: Afebrile 24h, off oxygen, eating, mobilising. Keen to go home.",
  }, { "x-tools-key": TOOLS_KEY });
  const W = wn.data?.document;
  step("Daily ward note (Medicine) + trends/labs", wn.ok && Array.isArray(W?.labTrends),
    W ? `${W.labTrends.length} trend(s), ${W.suggestedLabs.length} suggested lab(s)` : wn.error);

  // ── Summary ─────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${C.b}${passed === results.length ? C.g : C.y}RESULT: ${passed}/${results.length} checks passed${C.r}`);
  if (W?.labTrends?.length) console.log(`${C.grey}  e.g. ward-note trend: ${W.labTrends[0].slice(0, 90)}…${C.r}`);
  process.exit(passed === results.length ? 0 : 1);
}

run().catch((e) => { console.error(C.red + "FATAL: " + (e.message || e) + C.r); process.exit(1); });
