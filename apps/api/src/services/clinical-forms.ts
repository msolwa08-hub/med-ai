/**
 * Statutory & legal form drafting — MHCA 72-hour assessment paperwork, J88,
 * and surgical consent checklists, pre-filled from the clinical record.
 *
 * Design rule: these forms have legal weight, so the engine is explicit about
 * what it CAN pre-fill (clinical synthesis from the record) versus what it
 * MUST leave to the clinician (direct examination findings, verbatim patient
 * statements, opinions, signatures). Sections carry a status so the UI can
 * render prefilled text as editable and requires-* sections as prominent
 * empty slots — a pre-filled J88 opinion would be a forensic liability, not a
 * convenience.
 */
import Anthropic from '@anthropic-ai/sdk';
import { betaConfig } from '../lib/beta-config.js';
import { extractJSON } from '../lib/json-extract.js';
import { MEDAI_SYSTEM_PROMPT, HOD_DISCLAIMER, specialtyLens } from './hod-prompt.js';

const client = new Anthropic({ apiKey: betaConfig.ANTHROPIC_API_KEY });

export type LegalFormType = 'mhca-72hr' | 'j88' | 'surgical-consent';

export interface LegalFormRequest {
  formType: LegalFormType;
  dept: string;
  /** The intern-tools patient record (intake/history/assessment/problems). */
  patientRecord: Record<string, unknown>;
  /** e.g. planned procedure for consent, incident description for J88. */
  context?: string;
}

export interface LegalFormSection {
  heading: string;
  content: string;
  status: 'prefilled' | 'requires-input' | 'requires-examination';
}

export interface LegalFormDraft {
  formTitle: string;
  sections: LegalFormSection[];
  missingInfo: string[];
  legalNotes: string[];
  disclaimer: string;
}

const FORM_FRAMES: Record<LegalFormType, string> = {
  'mhca-72hr': `MENTAL HEALTH CARE ACT 17 of 2002 — 72-HOUR ASSESSMENT DOCUMENTATION.
Draft the clinical content supporting the statutory paperwork (application for involuntary/assisted care and the mental health care practitioner examinations). Sections to produce:
1. "Circumstances of presentation" — prefill from record: who brought the patient, presenting behaviour, collateral.
2. "Mental status examination" — status requires-examination: provide the MSE headings (appearance/behaviour, speech, mood/affect, thought form/content, perception, cognition, insight/judgement) as a scaffold, prefilling ONLY findings explicitly recorded.
3. "Evidence of mental illness AND likelihood of serious harm to self/others OR care/treatment/rehabilitation required" — prefill the argument from recorded facts; this is the statutory test, flag if the recorded facts do not yet meet it.
4. "Capacity assessment" — why the patient is unable/unwilling to consent, from record; requires-input if not documented.
5. "Organic screen" — prefill ordered/resulted work-up (glucose, UEC, HIV, RPR, TSH, urine tox), list what is missing.
6. "72-hour observation plan" — nursing observations, medication charted, review schedule.
Legal notes must include: statutory time limits, the requirement for TWO independent practitioner assessments, that the head of establishment authorises, and that detention beyond 72 hours needs Review Board pathways.`,
  j88: `J88 — REPORT BY AUTHORISED MEDICAL PRACTITIONER (medico-legal examination, SAPS).
Sections to produce:
1. "History as alleged by patient" — status requires-input, but prefill any incident description already recorded VERBATIM-STYLE with quotation framing ("Patient states..."). Never paraphrase into diagnostic language here.
2. "General examination" — requires-examination scaffold: demeanour, clothing condition if relevant, vitals.
3. "Clinical findings per region" — requires-examination scaffold listing body regions; prefill ONLY injuries explicitly documented in the record, each with site/size/type (abrasion/laceration/incised/contusion) wording. Remind: draw on the body diagram, measure, photograph if consented.
4. "Degree of force / consistency opinion" — requires-input: the practitioner's own opinion; provide the standard cautious phrasing options ("consistent with", never "proves").
5. "Conclusions" — requires-input.
Legal notes: the J88 is a court document — no abbreviations a layperson cannot read, no speculation beyond clinical competence, every alteration initialled, keep contemporaneous notes; chain of evidence for any samples.`,
  'surgical-consent': `SURGICAL/PROCEDURAL INFORMED CONSENT CHECKLIST (National Health Act s6-7 compliant).
Sections to produce:
1. "Procedure and indication" — prefill from record and the stated planned procedure.
2. "Material risks discussed" — prefill the procedure-SPECIFIC material risk list (bleeding, infection, anaesthetic risk, plus the risks a reasonable patient in THIS patient's position would attach significance to given their comorbidities from the record — e.g. diabetic wound sepsis, HIV immune status); status prefilled but flag each risk as a discussion checkbox.
3. "Alternatives including no treatment" — prefill realistic alternatives with honest outcome framing.
4. "Anaesthetic discussion" — prefill type expected; note separate anaesthetic consent where practice requires.
5. "Blood products consent" — requires-input (explicit separate yes/no).
6. "Capacity and language" — requires-input: capacity confirmation, interpreter used/needed (record preferred language if documented), who consents if a minor (parent/guardian; >12 years assent per Children's Act).
Legal notes: consent is a PROCESS not a signature; document in the language understood; emergency doctrine only covers what cannot wait.`,
};

// Deterministic statutory backstop — merged in whenever the model omits its
// legalNotes, because the legal obligations are not model-optional.
const LEGAL_BACKSTOPS: Record<LegalFormType, string[]> = {
  'mhca-72hr': [
    'MHCA 17/2002: TWO independent mental health care practitioner assessments (Form 05) required; neither may be the applicant.',
    'Head of health establishment authorises the 72-hour assessment; the clock runs from admission for assessment.',
    'Detention beyond 72 hours requires the further-involuntary-care pathway and Mental Health Review Board notification.',
    'Document capacity findings explicitly — involuntary criteria collapse without them.',
  ],
  j88: [
    'The J88 is a court document: write for a layperson, no unexplained abbreviations, no speculation beyond clinical competence.',
    'Record the history AS ALLEGED, in quoted framing — do not convert allegations into findings.',
    'Every alteration must be initialled; keep contemporaneous clinical notes separately.',
    'Chain of evidence applies to any samples taken; opinions limited to "consistent with", never proof.',
  ],
  'surgical-consent': [
    'Consent is a process, not a signature (National Health Act s6–7): document WHAT was explained and in WHICH language.',
    'Material risks are patient-specific — what THIS patient would attach significance to, given their comorbidities.',
    'Use an interpreter where needed and record who interpreted.',
    'Minors: parent/guardian consent with child assent per the Children\'s Act; emergency doctrine covers only what cannot wait.',
  ],
};

export async function draftLegalForm(req: LegalFormRequest): Promise<LegalFormDraft> {
  const frame = FORM_FRAMES[req.formType];

  const system = `${MEDAI_SYSTEM_PROMPT}

${specialtyLens(req.dept)}

TASK — STATUTORY FORM DRAFTING:
${frame}

HARD RULES:
- Pre-fill ONLY from facts present in the supplied record. Never invent findings, times, names or results.
- Anything requiring the clinician's direct examination or personal opinion gets status "requires-examination"/"requires-input" with a scaffold, not fabricated content.
- "missingInfo": every record gap that blocks completing the form.
- "legalNotes": the statutory/forensic obligations listed in the frame, punchy.

Respond with ONLY JSON:
{ "formTitle": "...", "sections": [{ "heading": "...", "content": "...", "status": "prefilled"|"requires-input"|"requires-examination" }], "missingInfo": ["..."], "legalNotes": ["..."] }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2500,
    system,
    messages: [
      {
        role: 'user',
        content: `DEPARTMENT: ${req.dept}\n${req.context ? `CONTEXT: ${req.context}\n` : ''}PATIENT RECORD:\n${JSON.stringify(req.patientRecord, null, 1)}`,
      },
    ],
  });

  const text = response.content[0]?.type === 'text' ? response.content[0].text : '{}';
  const parsed = extractJSON<Omit<LegalFormDraft, 'disclaimer'>>(text);

  const legalNotes =
    Array.isArray(parsed.legalNotes) && parsed.legalNotes.length > 0
      ? parsed.legalNotes
      : LEGAL_BACKSTOPS[req.formType];

  return {
    formTitle: parsed.formTitle ?? req.formType,
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    missingInfo: Array.isArray(parsed.missingInfo) ? parsed.missingInfo : [],
    legalNotes,
    disclaimer: HOD_DISCLAIMER,
  };
}
