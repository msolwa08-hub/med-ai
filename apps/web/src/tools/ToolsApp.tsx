import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AccessKeyGate } from '../components/AccessKeyGate';
import { toolsApi, type Problem, type RoundNote, type HistorySession, type HistorySummary, type AssistField, type SafetyWarning } from './toolsApi';
import { storage } from '../storage';
import { formatRoundNote } from './formatDocs';
import { AssistPanel } from './AssistPanel';
import { DetailsList } from './DetailsList';

// ─── Department config ──────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: 'medicine', label: 'General Medicine', color: 'blue', abbr: 'MED', icon: '🏥' },
  { id: 'surgery', label: 'Surgery', color: 'indigo', abbr: 'SURG', icon: '🔪' },
  { id: 'og', label: 'O&G', color: 'pink', abbr: 'O&G', icon: '🤱' },
  { id: 'paeds', label: 'Paediatrics', color: 'orange', abbr: 'PAEDS', icon: '👶' },
  { id: 'icu', label: 'ICU / HDU', color: 'red', abbr: 'ICU', icon: '💊' },
  { id: 'emergency', label: 'Emergency', color: 'rose', abbr: 'ED', icon: '🚨' },
  { id: 'psych', label: 'Psychiatry', color: 'purple', abbr: 'PSYCH', icon: '🧠' },
  { id: 'ortho', label: 'Orthopaedics', color: 'teal', abbr: 'ORTHO', icon: '🦴' },
] as const;

type DeptId = (typeof DEPARTMENTS)[number]['id'];

// ─── Patient data interfaces ────────────────────────────────────────────────

interface IntakeData {
  name: string;
  age: string;
  sex: string;
  ward: string;
  bed: string;
  admissionDate: string;
  admissionDiagnosis: string;
  allergies: string;
  // dept-specific fields
  gestationalAge?: string;
  gravida?: string;
  para?: string;
  lmp?: string;
  [key: string]: string | undefined;
}

interface HistoryData {
  chiefComplaint: string;
  hpi: string;
  pmh: string;
  medications: string;
  familyHistory: string;
  socialHistory: string;
  ros: string;
  importedSessionId?: string;
  importedSummary?: string;
  // dept-specific fields (obstetric Hx, MSE risk, development, ...)
  [key: string]: string | undefined;
}

interface AssessmentData {
  vitals: string;
  examination: string;
  investigations: string;
  dayOfAdmission: string;
  // dept-specific fields (SFH, Leopold's, FHR, MSE, primary survey, ...)
  [key: string]: string | undefined;
}

interface RoundData {
  plan: string;
  pending: string;
  subjective: string;
  generatedNote?: RoundNote;
}

interface Patient {
  id: string;
  intake: IntakeData;
  history: HistoryData;
  assessment: AssessmentData;
  problems: Problem[];
  roundData: RoundData;
  // one entry per generated ward-round note — the record's day-by-day story
  progressLog?: { date: string; note: string }[];
  // generated docs
  admissionNote?: string;
  wardNote?: string;
  discharge?: string;
  referral?: string;
  labInterpretation?: string;
  presentation?: string;
  obsNote?: string;
  gynaeNote?: string;
}

type Tab = 'intake' | 'history' | 'assessment' | 'problems' | 'round' | 'formulas' | 'documents' | 'specialist';

// ─── AI-assisted logging field specs ────────────────────────────────────────
// One spec per data-entry section: the AssistPanel drives a one-question-at-a-
// time conversation and fills these fields from the intern's freeform answers.

function intakeAssistFields(d: IntakeData, dept: DeptId): AssistField[] {
  const base: AssistField[] = [
    { key: 'name', label: 'Full Name', value: d.name, placeholder: 'Patient name' },
    { key: 'age', label: 'Age', value: d.age, placeholder: 'e.g. 34 years' },
    { key: 'sex', label: 'Sex', value: d.sex, hint: 'Male, Female or Other', kind: 'select', options: ['Male', 'Female', 'Other'] },
    { key: 'ward', label: 'Ward', value: d.ward, placeholder: 'Ward name' },
    { key: 'bed', label: 'Bed', value: d.bed, placeholder: 'Bed number' },
    { key: 'admissionDate', label: 'Admission Date', value: d.admissionDate },
    { key: 'allergies', label: 'Allergies', value: d.allergies, hint: 'NKDA or list', placeholder: 'NKDA or list' },
    { key: 'admissionDiagnosis', label: 'Admission Diagnosis', value: d.admissionDiagnosis, placeholder: 'Working diagnosis on admission' },
  ];
  if (dept === 'og') {
    base.push(
      { key: 'gestationalAge', label: 'Gestational Age', value: d.gestationalAge ?? '', placeholder: 'e.g. 32+4 weeks' },
      { key: 'lmp', label: 'LMP', value: d.lmp ?? '', placeholder: 'Last menstrual period' },
      { key: 'gravida', label: 'Gravida', value: d.gravida ?? '', placeholder: 'G?' },
      { key: 'para', label: 'Para', value: d.para ?? '', placeholder: 'P?' },
    );
  }
  if (dept === 'paeds') {
    base.push(
      { key: 'weight', label: 'Weight (kg)', value: d.weight ?? '', placeholder: 'kg' },
      { key: 'immunisations', label: 'Immunisations', value: d.immunisations ?? '', placeholder: 'Up to date / Behind / Unknown' },
      { key: 'birthHistory', label: 'Birth History', value: d.birthHistory ?? '', placeholder: 'Term/preterm, mode of delivery' },
      { key: 'caregiver', label: 'Caregiver', value: d.caregiver ?? '', placeholder: 'Parent/guardian name' },
    );
  }
  if (dept === 'icu') {
    base.push(
      { key: 'icuDay', label: 'ICU Day', value: d.icuDay ?? '', placeholder: 'Day of ICU admission' },
      { key: 'ventilator', label: 'Ventilator', value: d.ventilator ?? '', placeholder: 'Mode / settings' },
      { key: 'lines', label: 'Lines / Drains', value: d.lines ?? '', placeholder: 'CVC, art line, IDC, drains' },
      { key: 'vasopressors', label: 'Vasopressors', value: d.vasopressors ?? '', placeholder: 'None / agent + dose' },
    );
  }
  if (dept === 'ortho') {
    base.push(
      { key: 'procedure', label: 'Injury / Procedure', value: d.procedure ?? '', placeholder: 'Fracture / joint / procedure' },
      { key: 'popDay', label: 'Post-op Day', value: d.popDay ?? '', placeholder: 'Day post-op (if applicable)' },
      { key: 'immobilisation', label: 'Immobilisation', value: d.immobilisation ?? '', placeholder: 'POP, backslab, brace, etc.' },
      { key: 'dvtProphylaxis', label: 'DVT Prophylaxis', value: d.dvtProphylaxis ?? '', placeholder: 'LMWH / TED stockings / etc.' },
    );
  }
  return base;
}

function historyAssistFields(d: HistoryData, dept: DeptId): AssistField[] {
  const base: AssistField[] = [
    { key: 'chiefComplaint', label: 'Chief Complaint', value: d.chiefComplaint, placeholder: 'Main presenting complaint' },
    { key: 'hpi', label: 'Presenting Illness', value: d.hpi, hint: 'SOCRATES', kind: 'textarea', placeholder: 'SOCRATES: Site, Onset, Character, Radiation…' },
    { key: 'pmh', label: 'Past Medical History', value: d.pmh, kind: 'textarea', placeholder: 'Chronic conditions, previous hospitalisations, surgeries' },
    { key: 'medications', label: 'Medications', value: d.medications, kind: 'textarea', placeholder: 'Include herbal/traditional medicines' },
    { key: 'familyHistory', label: 'Family History', value: d.familyHistory, kind: 'textarea', placeholder: 'Relevant family history' },
    { key: 'socialHistory', label: 'Social History', value: d.socialHistory, kind: 'textarea', placeholder: 'Occupation, smoking, alcohol, home situation' },
    { key: 'ros', label: 'Review of Systems', value: d.ros, kind: 'textarea', placeholder: 'Relevant positive and negative findings' },
  ];
  if (dept === 'og') {
    base.splice(2, 0,
      { key: 'obstetricHistory', label: 'Obstetric History', value: d.obstetricHistory ?? '', kind: 'textarea', hint: 'each pregnancy: year, outcome, mode of delivery, complications, birth weight', placeholder: 'G/P detail: outcomes, modes of delivery, complications' },
      { key: 'antenatalCare', label: 'Antenatal Care', value: d.antenatalCare ?? '', kind: 'textarea', hint: 'booking, visits, scans, issues this pregnancy', placeholder: 'Booking GA, visits, scans, problems this pregnancy' },
      { key: 'gynaeHistory', label: 'Gynae History', value: d.gynaeHistory ?? '', kind: 'textarea', hint: 'menstrual history, contraception, pap smears, gynae surgery', placeholder: 'Menstrual Hx, contraception, pap smears, previous gynae surgery' },
    );
  }
  if (dept === 'paeds') {
    base.splice(2, 0,
      { key: 'development', label: 'Development', value: d.development ?? '', kind: 'textarea', hint: 'milestones appropriate for age?', placeholder: 'Gross motor, fine motor, language, social — for age' },
      { key: 'feeding', label: 'Feeding / Nutrition', value: d.feeding ?? '', kind: 'textarea', hint: 'breast/formula/solids, appetite', placeholder: 'Feeding pattern, appetite, recent changes' },
    );
  }
  if (dept === 'psych') {
    base.splice(2, 0,
      { key: 'psychHistory', label: 'Psychiatric History', value: d.psychHistory ?? '', kind: 'textarea', hint: 'previous episodes, admissions, suicide attempts, treatments', placeholder: 'Previous episodes, admissions, attempts, treatments' },
      { key: 'substanceUse', label: 'Substance Use', value: d.substanceUse ?? '', kind: 'textarea', hint: 'alcohol, cannabis, stimulants — amount, duration, last use', placeholder: 'Substances, amounts, duration, last use' },
      { key: 'collateral', label: 'Collateral History', value: d.collateral ?? '', kind: 'textarea', hint: 'from family/friends — note the source', placeholder: 'Collateral from family/carer (name the source)' },
    );
  }
  if (dept === 'surgery' || dept === 'ortho') {
    base.splice(4, 0,
      { key: 'lastMeal', label: 'Last Oral Intake', value: d.lastMeal ?? '', hint: 'NPO status for theatre', placeholder: 'Time of last food/fluids' },
      { key: 'anaestheticHistory', label: 'Anaesthetic History', value: d.anaestheticHistory ?? '', hint: 'previous GA/spinal, complications, airway issues', placeholder: 'Previous GA/spinal, complications' },
    );
  }
  return base;
}

function assessmentAssistFields(d: AssessmentData, dept: DeptId): AssistField[] {
  const base: AssistField[] = [
    { key: 'dayOfAdmission', label: 'Day of Admission', value: d.dayOfAdmission, placeholder: 'e.g. 1' },
    { key: 'vitals', label: 'Vitals', value: d.vitals, hint: 'BP, HR, RR, Temp, SpO2', kind: 'textarea', placeholder: 'Temp / BP / HR / RR / SpO2 / GCS / MEOWS' },
    { key: 'examination', label: 'Examination', value: d.examination, kind: 'textarea', placeholder: 'General, CVS, Respiratory, Abdomen, Neuro' },
    { key: 'investigations', label: 'Investigations', value: d.investigations, hint: 'bloods, imaging, other results', kind: 'textarea', placeholder: 'Lab results, imaging, ECG findings' },
  ];
  if (dept === 'og') {
    base.splice(3, 0,
      { key: 'sfh', label: 'SFH', value: d.sfh ?? '', hint: 'symphysis-fundal height in cm vs gestation', placeholder: 'e.g. 34cm — consistent with dates' },
      { key: 'lieAndPresentation', label: 'Lie & Presentation', value: d.lieAndPresentation ?? '', hint: "Leopold's maneuvers: lie, presentation, engagement in fifths", placeholder: 'e.g. longitudinal lie, cephalic, 3/5 palpable' },
      { key: 'fetalHeart', label: 'Fetal Heart', value: d.fetalHeart ?? '', hint: 'rate and where heard, or CTG summary', placeholder: 'e.g. FHR 142 bpm, left lower quadrant' },
      { key: 'contractions', label: 'Contractions', value: d.contractions ?? '', hint: 'frequency, duration, strength — or none', placeholder: 'e.g. 2 in 10, moderate — or none palpated' },
      { key: 'vaginalExam', label: 'Vaginal Exam', value: d.vaginalExam ?? '', hint: 'only if indicated: dilation, effacement, station, membranes', placeholder: 'If indicated: dilation / effacement / station / membranes' },
    );
  }
  if (dept === 'paeds') {
    base.splice(3, 0,
      { key: 'growth', label: 'Growth Parameters', value: d.growth ?? '', hint: 'weight, height, head circumference with centiles; MUAC', placeholder: 'Weight/height/HC + centiles, MUAC' },
      { key: 'hydration', label: 'Hydration Status', value: d.hydration ?? '', hint: 'fontanelle, turgor, mucous membranes, cap refill', placeholder: 'Hydration assessment findings' },
    );
  }
  if (dept === 'psych') {
    base.splice(3, 0,
      { key: 'mse', label: 'Mental State Exam', value: d.mse ?? '', kind: 'textarea', hint: 'appearance, behaviour, speech, mood/affect, thought, perception, cognition, insight', placeholder: 'MSE domains in order' },
      { key: 'riskAssessment', label: 'Risk Assessment', value: d.riskAssessment ?? '', kind: 'textarea', hint: 'suicide, harm to others, self-neglect — with protective factors', placeholder: 'Risk to self / others / self-neglect + protective factors' },
    );
  }
  if (dept === 'icu') {
    base.splice(3, 0,
      { key: 'ventSettings', label: 'Ventilation', value: d.ventSettings ?? '', hint: 'mode, FiO2, PEEP, latest ABG', placeholder: 'e.g. SIMV, FiO2 0.4, PEEP 8 — ABG: …' },
      { key: 'haemodynamics', label: 'Haemodynamics', value: d.haemodynamics ?? '', hint: 'MAP, vasopressor agents and doses, lactate', placeholder: 'MAP, pressor doses, lactate trend' },
    );
  }
  if (dept === 'emergency') {
    base.splice(1, 0,
      { key: 'primarySurvey', label: 'Primary Survey', value: d.primarySurvey ?? '', kind: 'textarea', hint: 'ABCDE with interventions', placeholder: 'A: … B: … C: … D: … E: …' },
    );
  }
  if (dept === 'ortho') {
    base.splice(3, 0,
      { key: 'neurovascular', label: 'Neurovascular Status', value: d.neurovascular ?? '', hint: 'distal pulses, sensation, motor, capillary refill', placeholder: 'Pulses / sensation / motor / cap refill distal to injury' },
    );
  }
  return base;
}

function roundAssistFields(d: RoundData): AssistField[] {
  return [
    { key: 'subjective', label: 'Subjective', value: d.subjective, kind: 'textarea', placeholder: 'How does the patient feel? Any new complaints?' },
    { key: 'plan', label: 'Plan for Today', value: d.plan, kind: 'textarea', placeholder: 'Active management for today' },
    { key: 'pending', label: 'Pending', value: d.pending, kind: 'textarea', placeholder: 'Awaiting results, consults, procedures' },
  ];
}

// One line about THIS patient, sent with every assist/scan call so the AI
// asks specialty- and situation-appropriate questions (e.g. at EGA 32+4 it
// asks about contractions, not generic pain).
function patientContext(p: Patient, dept: DeptId): string {
  const i = p.intake;
  const bits = [
    [i.age, i.sex].filter(Boolean).join(' '),
    dept === 'og' && (i.gravida || i.para) ? `G${i.gravida || '?'}P${i.para || '?'}` : '',
    dept === 'og' && i.gestationalAge ? `EGA ${i.gestationalAge}` : '',
    dept === 'og' && i.lmp ? `LMP ${i.lmp}` : '',
    dept === 'paeds' && i.weight ? `${i.weight}kg` : '',
    i.admissionDiagnosis ? `admitted with ${i.admissionDiagnosis}` : '',
    i.allergies ? `allergies: ${i.allergies}` : '',
  ].filter(Boolean);
  return bits.join(', ');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newPatient(dept: DeptId): Patient {
  return {
    id: uid(),
    intake: {
      name: '', age: '', sex: '', ward: '', bed: '',
      admissionDate: new Date().toISOString().slice(0, 10),
      admissionDiagnosis: '', allergies: '',
    },
    history: {
      chiefComplaint: '', hpi: '', pmh: '', medications: '',
      familyHistory: '', socialHistory: '', ros: '',
    },
    assessment: { vitals: '', examination: '', investigations: '', dayOfAdmission: '1' },
    problems: [],
    roundData: { plan: '', pending: '', subjective: '' },
  };
}

// ─── Shared UI components ────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-gray-500 mb-1">{children}</label>;
}

function TextInput({
  value, onChange, placeholder, className = '',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 ${className}`}
    />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
    />
  );
}

function AiBtn({
  onClick, loading, label = 'Generate',
}: {
  onClick: () => void; loading: boolean; label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : '✨'}
      {label}
    </button>
  );
}

function DocOutput({ text, onCopy }: { text: string; onCopy: () => void }) {
  return (
    <div className="mt-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex justify-end px-3 py-1.5 border-b border-gray-200">
        <button onClick={onCopy} className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
          Copy
        </button>
      </div>
      <pre className="text-xs text-gray-700 p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-72">
        {text}
      </pre>
    </div>
  );
}

function Disclaimer({ text }: { text: string }) {
  return (
    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
      ⚠️ {text}
    </p>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{children}</h3>;
}

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── DEPARTMENT SELECTOR ────────────────────────────────────────────────────

function DeptSelector({ onSelect }: { onSelect: (d: DeptId) => void }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
    indigo: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400',
    pink: 'bg-pink-50 border-pink-200 hover:border-pink-400',
    orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
    red: 'bg-red-50 border-red-200 hover:border-red-400',
    rose: 'bg-rose-50 border-rose-200 hover:border-rose-400',
    purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
    teal: 'bg-teal-50 border-teal-200 hover:border-teal-400',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <img src="/medai-icon.svg" alt="" className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-gray-900 text-2xl font-bold">Intern Tools</h1>
        <p className="text-gray-500 text-sm mt-2">Select your department to get started</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
        {DEPARTMENTS.map(d => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`${colorMap[d.color]} border rounded-2xl p-5 text-center transition-all duration-150 cursor-pointer group`}
          >
            <div className="text-3xl mb-2">{d.icon}</div>
            <p className="text-gray-800 font-medium text-sm">{d.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">{d.abbr}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── INTAKE TAB ─────────────────────────────────────────────────────────────

function IntakeTab({ patient, toolsKey, dept, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  onChange: (patch: Partial<IntakeData>) => void;
}) {
  const d = patient.intake;
  const fields = intakeAssistFields(d, dept);

  return (
    <div className="space-y-6">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        section="Intake"
        fields={fields}
        context={patientContext(patient, dept)}
        onUpdates={u => onChange(u as Partial<IntakeData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList fields={fields} onEdit={(key, value) => onChange({ [key]: value })} />
      </div>
    </div>
  );
}

// ─── HISTORY TAB ─────────────────────────────────────────────────────────────

function HistoryTab({ patient, toolsKey, dept, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  onChange: (patch: Partial<HistoryData>) => void;
}) {
  const [starting, setStarting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [histSession, setHistSession] = useState<HistorySession | null>(null);
  const [histSummary, setHistSummary] = useState<HistorySummary | null>(null);
  const [importId, setImportId] = useState(patient.history.importedSessionId ?? '');
  const [err, setErr] = useState('');

  const ageSex = `${patient.intake.age} ${patient.intake.sex}`.trim();

  async function startHistory() {
    setStarting(true);
    setErr('');
    try {
      const result = await toolsApi.startHistory(toolsKey, {
        department: dept,
        ageSex: ageSex || undefined,
        chiefComplaintHint: patient.intake.admissionDiagnosis || undefined,
      });
      setHistSession(result);
      onChange({ importedSessionId: result.sessionId });
    } catch (e) {
      setErr('Failed to start history session.');
    } finally {
      setStarting(false);
    }
  }

  async function importHistory() {
    const sid = importId || patient.history.importedSessionId;
    if (!sid) return;
    setImporting(true);
    setErr('');
    try {
      const result = await toolsApi.importHistory(toolsKey, sid);
      setHistSummary(result);
      if (result.summary) onChange({ importedSummary: result.summary });
      if (result.history) onChange({ hpi: result.history });
      if (result.complaints?.length) onChange({ chiefComplaint: result.complaints.join(', ') });
    } catch {
      setErr('Failed to import history. Check the session ID.');
    } finally {
      setImporting(false);
    }
  }

  const patientUrl = histSession?.patientUrl
    ? `${window.location.origin}${histSession.patientUrl}`
    : null;

  return (
    <div className="space-y-5">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        section="History"
        fields={historyAssistFields(patient.history, dept)}
        context={patientContext(patient, dept)}
        onUpdates={u => onChange(u as Partial<HistoryData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={historyAssistFields(patient.history, dept)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<HistoryData>)}
        />
      </div>

      {/* AI History Section */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
        <SectionHead>AI-Assisted History Taking</SectionHead>
        <p className="text-gray-500 text-xs mb-4">
          Start an AI session for the patient to complete their history. Share the link, then import when done.
        </p>

        <div className="flex gap-3 mb-4">
          <AiBtn onClick={startHistory} loading={starting} label="Start Patient Session" />
        </div>

        {patientUrl && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
            <p className="text-xs text-gray-500 mb-1">Share this link with the patient:</p>
            <div className="flex items-center gap-2">
              <code className="text-teal-700 text-xs flex-1 break-all">{patientUrl}</code>
              <button
                onClick={() => copy(patientUrl)}
                className="text-xs text-gray-500 hover:text-gray-900 shrink-0 bg-gray-100 px-2 py-1 rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs text-gray-500 mb-2">Import completed history by session ID:</p>
          <div className="flex gap-2">
            <TextInput
              value={importId}
              onChange={setImportId}
              placeholder="Session ID (auto-filled if started above)"
            />
            <button
              onClick={importHistory}
              disabled={importing || !importId}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors shrink-0"
            >
              {importing ? '...' : 'Import'}
            </button>
          </div>
        </div>

        {err && <p className="text-red-400 text-xs mt-2">{err}</p>}

        {histSummary && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <p className="text-xs font-medium text-emerald-700 mb-1">
              {histSummary.completed ? '✓ History imported' : '⏳ Session in progress'}
            </p>
            {histSummary.summary && (
              <p className="text-xs text-gray-600 leading-relaxed">{histSummary.summary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ASSESSMENT TAB ──────────────────────────────────────────────────────────

function AssessmentTab({ patient, toolsKey, dept, onChange, onAdmNote }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  onChange: (patch: Partial<AssessmentData>) => void;
  onAdmNote: (note: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(patient.admissionNote ?? '');
  const [err, setErr] = useState('');

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const r = await toolsApi.admissionNote(toolsKey, {
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        dayOfAdmission: patient.assessment.dayOfAdmission,
      });
      const text = `ADMISSION NOTE\n==============\n\n${r.admissionNote}\n\nWORKING DIAGNOSIS: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nINITIAL PLAN:\n${r.initialPlan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      setResult(text);
      onAdmNote(text);
    } catch {
      setErr('Failed to generate admission note.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        section="Assessment"
        fields={assessmentAssistFields(patient.assessment, dept)}
        context={patientContext(patient, dept)}
        onUpdates={u => onChange(u as Partial<AssessmentData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={assessmentAssistFields(patient.assessment, dept)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<AssessmentData>)}
        />
      </div>

      <div className="flex gap-3">
        <AiBtn onClick={generate} loading={loading} label="Generate Admission Note" />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {result && <DocOutput text={result} onCopy={() => copy(result)} />}
    </div>
  );
}

// ─── PROBLEMS TAB ────────────────────────────────────────────────────────────

function SafetyBanner({ warnings }: { warnings: SafetyWarning[] }) {
  if (warnings.length === 0) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-2">
      <SectionHead>Medication Safety</SectionHead>
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`text-[13px] rounded-xl px-4 py-2.5 border ${
            w.severity === 'BLOCK'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <span className="font-semibold">{w.severity === 'BLOCK' ? '⛔' : '⚠️'} {w.drug}</span>
          <span className="text-[11px] uppercase tracking-wide ml-2 opacity-60">{w.category}</span>
          <p className="mt-0.5 leading-relaxed">{w.reason}</p>
        </div>
      ))}
    </div>
  );
}

function ProblemsTab({ patient, toolsKey, dept, problems, onChange }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  problems: Problem[];
  onChange: (problems: Problem[]) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [warnings, setWarnings] = useState<SafetyWarning[]>([]);
  const [aiNote, setAiNote] = useState('');
  const [err, setErr] = useState('');

  async function suggest() {
    setSuggesting(true);
    setErr('');
    try {
      const res = await toolsApi.suggestProblems(toolsKey, {
        dept,
        intake: patient.intake,
        history: patient.history,
        assessment: patient.assessment,
      });
      // Don't duplicate problems already on the list — re-clicking Suggest
      // should refine, not multiply.
      const existing = new Set(problems.map(p => p.problem.trim().toLowerCase()));
      const suggested: Problem[] = res.problems
        .filter(p => !existing.has(p.problem.trim().toLowerCase()))
        .map(p => ({
          id: uid(),
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
          status: 'active',
          icd10: p.icd10,
          stgCondition: p.stgCondition,
        }));
      onChange([...problems, ...suggested]);
      setWarnings(res.safety);
      setAiNote(
        suggested.length === 0 && res.problems.length > 0
          ? 'No new problems — the suggestions matched what is already on the list.'
          : res.note
      );
    } catch {
      setErr('Could not generate the problem list — check the record has enough detail, or add problems manually.');
    } finally {
      setSuggesting(false);
    }
  }

  async function checkInteractions() {
    setChecking(true);
    setErr('');
    try {
      const res = await toolsApi.interactionCheck(toolsKey, {
        medicationsText: patient.history.medications,
        allergiesText: patient.intake.allergies,
        plannedLines: problems.flatMap(p => p.management),
        problemCodes: problems.map(p => p.icd10 ?? ''),
      });
      setWarnings(res.warnings);
      if (res.warnings.length === 0) {
        setAiNote(`No interactions found across ${res.medCount} current medication${res.medCount === 1 ? '' : 's'} and the planned management.`);
      }
    } catch {
      setErr('Interaction check failed.');
    } finally {
      setChecking(false);
    }
  }

  function addProblem() {
    onChange([
      ...problems,
      {
        id: uid(),
        problem: '',
        workingDx: '',
        differentials: [],
        management: [],
        status: 'active',
      },
    ]);
  }

  function updateProblem(id: string, patch: Partial<Problem>) {
    onChange(problems.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }

  function removeProblem(id: string) {
    onChange(problems.filter(p => p.id !== id));
  }

  const statusColors: Record<string, string> = {
    active: 'bg-red-100 text-red-700',
    resolving: 'bg-yellow-100 text-yellow-700',
    resolved: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <SectionHead>Problem List</SectionHead>
        <div className="flex items-center gap-3">
          <AiBtn onClick={suggest} loading={suggesting} label="Suggest from assessment" />
          <button
            onClick={checkInteractions}
            disabled={checking}
            className="text-[13px] bg-gray-50 hover:bg-amber-50 disabled:opacity-40 text-amber-700 px-3.5 py-2 rounded-full font-medium transition-colors"
          >
            {checking ? 'Checking…' : '⚠️ Check interactions'}
          </button>
          <button
            onClick={addProblem}
            className="text-sm text-teal-600 hover:text-teal-700 transition-colors"
          >
            + Add Problem
          </button>
        </div>
      </div>

      {err && <p className="text-red-500 text-xs">{err}</p>}
      {aiNote && (
        <p className="text-[13px] text-teal-800 bg-teal-50 border border-teal-100 rounded-xl px-4 py-2.5">
          {aiNote}
        </p>
      )}
      <SafetyBanner warnings={warnings} />

      {problems.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">No problems added yet</p>
          <p className="text-xs mt-1">"Suggest from assessment" builds one from the record — or add problems manually</p>
        </div>
      )}

      {problems.map((p, idx) => (
        <div key={p.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-gray-400 text-sm font-mono mt-2 shrink-0">{idx + 1}.</span>
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label>Problem</Label>
                  <TextInput
                    value={p.problem}
                    onChange={v => updateProblem(p.id, { problem: v })}
                    placeholder="e.g. Chest pain, fever, hyponatraemia"
                  />
                </div>
                <div className="w-32">
                  <Label>Status</Label>
                  <select
                    value={p.status}
                    onChange={e => updateProblem(p.id, { status: e.target.value as Problem['status'] })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="resolving">Resolving</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Working Diagnosis</Label>
                <TextInput
                  value={p.workingDx}
                  onChange={v => updateProblem(p.id, { workingDx: v })}
                  placeholder="Most likely diagnosis"
                />
              </div>

              <div>
                <Label>Differentials (comma-separated)</Label>
                <TextInput
                  value={p.differentials.join(', ')}
                  onChange={v => updateProblem(p.id, { differentials: v.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="e.g. ACS, PE, aortic dissection"
                />
                {p.differentials.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {p.differentials.map((d, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Management Plan (one item per line)</Label>
                <TextArea
                  value={p.management.join('\n')}
                  onChange={v => updateProblem(p.id, { management: v.split('\n').filter(Boolean) })}
                  placeholder="e.g. IV morphine 2mg q4h prn&#10;Serial ECGs&#10;Troponin in 6h"
                  rows={3}
                />
                {p.management.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {p.management.map((m, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <input type="checkbox" className="mt-0.5 accent-blue-500" />
                        {m}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={() => removeProblem(p.id)}
              className="text-gray-400 hover:text-red-400 transition-colors text-lg shrink-0"
            >
              ×
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status]}`}>
              {p.status}
            </span>
            {p.stgCondition && (
              <span
                className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100"
                title="Management anchored to this SA Standard Treatment Guideline entry"
              >
                📖 STG: {p.stgCondition}{p.icd10 ? ` · ${p.icd10}` : ''}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ROUND TAB ──────────────────────────────────────────────────────────────

function RoundTab({ patient, toolsKey, dept, onChange, onLog }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
  onChange: (patch: Partial<RoundData>) => void;
  onLog: (note: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const rd = patient.roundData;

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const result = await toolsApi.roundNote(toolsKey, {
        patientName: patient.intake.name || 'Unknown',
        age: patient.intake.age,
        sex: patient.intake.sex,
        ward: patient.intake.ward,
        admissionDiagnosis: patient.intake.admissionDiagnosis,
        dayOfAdmission: parseInt(patient.assessment.dayOfAdmission) || 1,
        subjective: rd.subjective || patient.history.chiefComplaint,
        vitals: patient.assessment.vitals,
        examination: patient.assessment.examination,
        investigations: patient.assessment.investigations,
        problems: patient.problems.map(p => ({
          problem: p.problem,
          workingDx: p.workingDx,
          management: p.management,
        })),
        plan: rd.plan,
        pending: rd.pending,
      });
      onChange({ generatedNote: result });
      onLog(formatRoundNote(result));
    } catch {
      setErr('Failed to generate round note.');
    } finally {
      setLoading(false);
    }
  }

  const noteText = rd.generatedNote ? formatRoundNote(rd.generatedNote) : '';

  return (
    <div className="space-y-5">
      <AssistPanel
        toolsKey={toolsKey}
        dept={dept}
        section="Ward Round"
        fields={roundAssistFields(rd)}
        context={patientContext(patient, dept)}
        onUpdates={u => onChange(u as Partial<RoundData>)}
      />

      <div>
        <SectionHead>Details</SectionHead>
        <DetailsList
          fields={roundAssistFields(rd)}
          onEdit={(key, value) => onChange({ [key]: value } as Partial<RoundData>)}
        />
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
        <SectionHead>Daily Round Note</SectionHead>
        <p className="text-gray-500 text-xs mb-4">
          Auto-generated half-page ward round summary (SOAP format, ≤25 lines) from your patient data.
        </p>

        <div className="flex gap-3">
          <AiBtn onClick={generate} loading={loading} label="Generate Ward Round Note" />
          {noteText && (
            <button
              onClick={() => copy(noteText)}
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              Copy
            </button>
          )}
          {noteText && (
            <button
              onClick={() => window.print()}
              className="text-sm text-gray-500 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-lg transition-colors"
            >
              Print
            </button>
          )}
        </div>

        {err && <p className="text-red-400 text-xs mt-2">{err}</p>}
      </div>

      {noteText && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm print:shadow-none">
          <pre className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed font-mono">
            {noteText}
          </pre>
        </div>
      )}

      {(patient.progressLog?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <SectionHead>Progress ({patient.progressLog!.length} round{patient.progressLog!.length === 1 ? '' : 's'})</SectionHead>
          <div className="space-y-2">
            {[...patient.progressLog!].reverse().map((entry, i) => (
              <details key={i} className="group border border-gray-100 rounded-xl overflow-hidden">
                <summary className="cursor-pointer px-4 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                  <span>🗓 {entry.date} — round note</span>
                  <span className="text-gray-300 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                  {entry.note}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FORMULAS TAB ───────────────────────────────────────────────────────────

// Keyword-driven calculator suggestions: scan the record (diagnosis,
// differentials, investigations, examination) and surface the scores that are
// actually relevant to this patient.
const CALC_TRIGGERS: Array<{ calc: string; pattern: RegExp; reason: string }> = [
  { calc: 'aki', pattern: /\baki\b|acute kidney|creatinine|oligur|anuri|renal (failure|impair|injur)|urea/i, reason: 'renal function mentioned' },
  { calc: 'gfr', pattern: /\baki\b|creatinine|renal|kidney|ckd|nephro/i, reason: 'renal function mentioned' },
  { calc: 'heart', pattern: /chest pain|\bacs\b|troponin|angina|\bstemi\b|\bnstemi\b/i, reason: 'possible cardiac chest pain' },
  { calc: 'crb65', pattern: /pneumonia|\bcap\b|consolidat/i, reason: 'pneumonia severity' },
  { calc: 'wellspe', pattern: /pulmonary embol|\bpe\b(?![a-z])|pleuritic/i, reason: 'PE in the differential' },
  { calc: 'wellsdvt', pattern: /\bdvt\b|deep vein|leg swelling|calf (pain|swelling)/i, reason: 'DVT in the differential' },
  { calc: 'qsofa', pattern: /sepsis|septic|infection.*hypotens|\bsirs\b/i, reason: 'sepsis screen' },
  { calc: 'sofa', pattern: /sepsis|septic shock|organ (failure|dysfunction)/i, reason: 'organ dysfunction' },
  { calc: 'gcs', pattern: /\bgcs\b|head injur|reduced (loc|level of consciousness)|unconscious|confus/i, reason: 'consciousness assessment' },
  { calc: 'phq9', pattern: /depress|low mood|suicid/i, reason: 'mood screen' },
  { calc: 'eddga', pattern: /pregnan|gestation|antenatal|\blmp\b/i, reason: 'pregnancy dating' },
  { calc: 'meows', pattern: /pregnan|obstetric|antenatal/i, reason: 'obstetric early warning' },
  { calc: 'epds', pattern: /postnatal|postpartum|puerperal/i, reason: 'postnatal mood screen' },
  { calc: 'ectopic', pattern: /ectopic|\bpv bleed|amenorrhoea.*pain/i, reason: 'possible ectopic' },
  { calc: 'bishop', pattern: /induction|labour|labor/i, reason: 'labour assessment' },
  { calc: 'bmi', pattern: /obes|overweight|malnutri|underweight/i, reason: 'weight assessment' },
];

function suggestCalculators(patient: Patient): Array<{ calc: string; reason: string }> {
  const text = [
    patient.intake.admissionDiagnosis,
    patient.history.chiefComplaint,
    patient.history.hpi,
    patient.history.pmh,
    patient.assessment.examination,
    patient.assessment.investigations,
    ...patient.problems.flatMap(p => [p.problem, p.workingDx, ...p.differentials]),
  ]
    .filter(Boolean)
    .join(' \n ');
  if (!text.trim()) return [];
  const seen = new Set<string>();
  const out: Array<{ calc: string; reason: string }> = [];
  for (const t of CALC_TRIGGERS) {
    if (seen.has(t.calc)) continue;
    if (t.pattern.test(text)) {
      seen.add(t.calc);
      out.push({ calc: t.calc, reason: t.reason });
    }
  }
  return out;
}

function FormulasTab({ dept, patient }: { dept: DeptId; patient: Patient }) {
  const [calc, setCalc] = useState('');

  const calcs: Record<string, React.ReactNode> = {
    gcs: <GCSCalc />,
    bmi: <BMICalc />,
    gfr: <GFRCalc />,
    aki: <AKICalc />,
    qsofa: <QSOFACalc />,
    sofa: <SOFACalc />,
    heart: <HEARTCalc />,
    wellspe: <WellsPECalc />,
    wellsdvt: <WellsDVTCalc />,
    crb65: <CRB65Calc />,
    phq9: <PHQ9Calc />,
    bishop: <BishopCalc />,
    apgar: <APGARCalc />,
    eddga: <EddGaCalc />,
    meows: <MEOWSCalc />,
    epds: <EPDSCalc />,
    rmi: <RMICalc />,
    pcos: <PCOSCalc />,
    pcos_h: <PCOSHormonesCalc />,
    ectopic: <EctopicCalc />,
    fertility: <FertilityCalc />,
  };

  const allCalcs = [
    { id: 'gcs', label: 'GCS', depts: ['medicine', 'surgery', 'icu', 'emergency', 'ortho'] },
    { id: 'bmi', label: 'BMI', depts: ['medicine', 'surgery', 'og', 'paeds', 'icu', 'emergency', 'psych', 'ortho'] },
    { id: 'gfr', label: 'eGFR (CKD-EPI)', depts: ['medicine', 'surgery', 'icu', 'emergency'] },
    { id: 'aki', label: 'AKI (KDIGO)', depts: ['medicine', 'surgery', 'icu', 'emergency', 'ortho'] },
    { id: 'qsofa', label: 'qSOFA', depts: ['medicine', 'surgery', 'icu', 'emergency'] },
    { id: 'sofa', label: 'SOFA', depts: ['icu'] },
    { id: 'heart', label: 'HEART Score', depts: ['medicine', 'emergency'] },
    { id: 'wellspe', label: "Wells' PE", depts: ['medicine', 'surgery', 'emergency', 'ortho'] },
    { id: 'wellsdvt', label: "Wells' DVT", depts: ['medicine', 'surgery', 'emergency', 'ortho'] },
    { id: 'crb65', label: 'CRB-65', depts: ['medicine', 'emergency'] },
    { id: 'phq9', label: 'PHQ-9', depts: ['medicine', 'psych', 'emergency'] },
    { id: 'bishop', label: 'Bishop Score', depts: ['og'] },
    { id: 'apgar', label: 'APGAR', depts: ['og', 'paeds'] },
    { id: 'eddga', label: 'EDD / GA', depts: ['og'] },
    { id: 'meows', label: 'MEOWS', depts: ['og'] },
    { id: 'epds', label: 'EPDS', depts: ['og', 'psych'] },
    { id: 'rmi', label: 'RMI (Ovarian)', depts: ['og'] },
    { id: 'pcos', label: 'PCOS Rotterdam', depts: ['og'] },
    { id: 'pcos_h', label: 'PCOS Hormones', depts: ['og'] },
    { id: 'ectopic', label: 'Ectopic Assessment', depts: ['og', 'emergency'] },
    { id: 'fertility', label: 'Fertility Workup', depts: ['og'] },
  ];

  const relevant = allCalcs.filter(c => c.depts.includes(dept));
  const others = allCalcs.filter(c => !c.depts.includes(dept));
  const suggested = suggestCalculators(patient)
    .map(s => ({ ...s, meta: allCalcs.find(c => c.id === s.calc) }))
    .filter(s => s.meta);

  return (
    <div className="space-y-4">
      {suggested.length > 0 && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5">
          <SectionHead>Suggested for this patient</SectionHead>
          <div className="flex flex-wrap gap-2">
            {suggested.map(s => (
              <button
                key={s.calc}
                onClick={() => setCalc(calc === s.calc ? '' : s.calc)}
                title={`Suggested because: ${s.reason}`}
                className={`text-sm px-3.5 py-2 rounded-full border transition-colors ${
                  calc === s.calc
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-teal-50 border-teal-200 text-teal-800 hover:border-teal-400'
                }`}
              >
                ✨ {s.meta!.label}
                <span className={`ml-1.5 text-[11px] ${calc === s.calc ? 'text-teal-100' : 'text-teal-600/70'}`}>{s.reason}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <SectionHead>Recommended for {DEPARTMENTS.find(d => d.id === dept)?.label}</SectionHead>
        <div className="flex flex-wrap gap-2">
          {relevant.map(c => (
            <button
              key={c.id}
              onClick={() => setCalc(calc === c.id ? '' : c.id)}
              className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                calc === c.id
                  ? 'bg-teal-600 border-teal-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {others.length > 0 && (
        <div>
          <SectionHead>Other Calculators</SectionHead>
          <div className="flex flex-wrap gap-2">
            {others.map(c => (
              <button
                key={c.id}
                onClick={() => setCalc(calc === c.id ? '' : c.id)}
                className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                  calc === c.id
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {calc && calcs[calc] && (
        <div className="mt-2">{calcs[calc]}</div>
      )}
    </div>
  );
}

// ─── DOCUMENTS TAB ──────────────────────────────────────────────────────────

function DocumentsTab({ patient, toolsKey, dept }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
}) {
  const [activeDoc, setActiveDoc] = useState('');
  const [loading, setLoading] = useState('');
  const [results, setResults] = useState<Record<string, string>>({});
  const [err, setErr] = useState('');

  async function generate(docType: string) {
    setLoading(docType);
    setErr('');
    try {
      let text = '';
      const base = { ...patient.intake, ...patient.history, ...patient.assessment };

      if (docType === 'discharge') {
        const r = await toolsApi.discharge(toolsKey, base);
        text = `DISCHARGE SUMMARY\n=================\n\n${r.patientSummary}\n\nDIAGNOSIS: ${r.diagnosis}\n\nTREATMENT: ${r.treatmentProvided}\n\nMEDICATIONS:\n${r.dischargeMedications.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nFOLLOW-UP: ${r.followUpInstructions}\n\nRETURN IF:\n${r.warningSignsToReturn.map(w => `• ${w}`).join('\n')}\n\n---\n${r.disclaimer}`;
      } else if (docType === 'referral') {
        const r = await toolsApi.referral(toolsKey, base);
        text = `REFERRAL LETTER (${r.urgency.toUpperCase()})\n${'='.repeat(30)}\n\n${r.referralLetter}\n\n---\n${r.disclaimer}`;
      } else if (docType === 'wardnote') {
        const r = await toolsApi.wardNote(toolsKey, base);
        text = `${r.note}\n\n---\n${r.disclaimer}`;
      } else if (docType === 'labs') {
        const r = await toolsApi.interpretLabs(toolsKey, base);
        text = `LAB INTERPRETATION\n==================\n\n${r.interpretation}\n\nKEY ABNORMALITIES:\n${r.keyAbnormalities.map(a => `• ${a}`).join('\n')}\n\nCLINICAL SIGNIFICANCE:\n${r.clinicalSignificance}\n\nRECOMMENDATIONS:\n${r.recommendations.map(r2 => `• ${r2}`).join('\n')}\n\n---\n${r.disclaimer}`;
      } else if (docType === 'presentation') {
        const r = await toolsApi.presentPatient(toolsKey, base);
        text = `${r.oneLineSummary}\n\n${r.presentation}\n\n---\n${r.disclaimer}`;
      }

      setResults(prev => ({ ...prev, [docType]: text }));
      setActiveDoc(docType);
    } catch {
      setErr(`Failed to generate ${docType}.`);
    } finally {
      setLoading('');
    }
  }

  const docs = [
    { id: 'discharge', label: 'Discharge Summary' },
    { id: 'referral', label: 'Referral Letter' },
    { id: 'wardnote', label: 'Ward Note (SOAP)' },
    { id: 'labs', label: 'Interpret Labs' },
    { id: 'presentation', label: 'Ward Round Presentation' },
  ];

  return (
    <div className="space-y-4">
      <SectionHead>Generate Clinical Documents</SectionHead>
      <div className="flex flex-wrap gap-2">
        {docs.map(d => (
          <AiBtn
            key={d.id}
            onClick={() => generate(d.id)}
            loading={loading === d.id}
            label={d.label}
          />
        ))}
      </div>

      {err && <p className="text-red-400 text-xs">{err}</p>}

      {docs.map(d =>
        results[d.id] ? (
          <div key={d.id}>
            <p className="text-xs font-medium text-gray-500 mb-1">{d.label}</p>
            <DocOutput text={results[d.id]} onCopy={() => copy(results[d.id])} />
          </div>
        ) : null
      )}
    </div>
  );
}

// ─── SPECIALIST TAB (O&G) ─────────────────────────────────────────────────────

function SpecialistTab({ patient, toolsKey, dept }: {
  patient: Patient;
  toolsKey: string;
  dept: DeptId;
}) {
  const [mode, setMode] = useState<'obs' | 'gynae'>('obs');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');

  if (dept !== 'og') {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">🏷️</p>
        <p>Specialist tab is currently available for O&G.</p>
        <p className="text-sm mt-1">More specialties coming soon.</p>
      </div>
    );
  }

  async function generate() {
    setLoading(true);
    setErr('');
    try {
      const base = { ...patient.intake, ...patient.history, ...patient.assessment };
      let text = '';
      if (mode === 'obs') {
        const r = await toolsApi.obsNote(toolsKey, base);
        text = `OBSTETRIC NOTE\n==============\n\nGA: ${r.gestationalAge}\n\n${r.note}\n\nMATERNAL STATUS: ${r.maternalStatus}\nFETAL STATUS: ${r.fetalStatus}\n\nPLAN:\n${r.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      } else {
        const r = await toolsApi.gynaeNote(toolsKey, base);
        text = `GYNAECOLOGY NOTE\n================\n\n${r.note}\n\nWORKING DX: ${r.workingDiagnosis}\n\nDIFFERENTIALS:\n${r.differentials.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\nPLAN:\n${r.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n\n---\n${r.disclaimer}`;
      }
      setResult(text);
    } catch {
      setErr('Failed to generate note.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <SectionHead>O&G Specialist Notes</SectionHead>
      <div className="flex gap-2">
        {(['obs', 'gynae'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === m ? 'bg-pink-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {m === 'obs' ? '🤱 Obstetrics' : '⚕️ Gynaecology'}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <AiBtn onClick={generate} loading={loading} label={`Generate ${mode === 'obs' ? 'Obs' : 'Gynae'} Note`} />
      </div>
      {err && <p className="text-red-400 text-xs">{err}</p>}
      {result && <DocOutput text={result} onCopy={() => copy(result)} />}
    </div>
  );
}

// ─── CALCULATORS ─────────────────────────────────────────────────────────────

function CalcCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs text-gray-500 w-40 shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function NumInput({ value, onChange, min, max, placeholder }: {
  value: number | ''; onChange: (v: number | '') => void; min?: number; max?: number; placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      min={min}
      max={max}
      placeholder={placeholder ?? '0'}
      className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
    />
  );
}

function Result({ label, value, color = 'blue' }: { label: string; value: string; color?: string }) {
  const c = { blue: 'text-teal-700', green: 'text-emerald-700', yellow: 'text-yellow-600', red: 'text-red-600', pink: 'text-pink-600' };
  return (
    <div className={`mt-3 text-sm font-medium ${c[color as keyof typeof c] ?? 'text-teal-700'}`}>
      {label}: {value}
    </div>
  );
}

function GCSCalc() {
  const [e, setE] = useState<number | ''>(4);
  const [v, setV] = useState<number | ''>(5);
  const [m, setM] = useState<number | ''>(6);
  const total = (Number(e) || 0) + (Number(v) || 0) + (Number(m) || 0);
  const sev = total >= 13 ? 'Mild' : total >= 9 ? 'Moderate' : 'Severe';
  return (
    <CalcCard title="Glasgow Coma Scale">
      <Row label="Eyes (1-4)"><NumInput value={e} onChange={setE} min={1} max={4} /></Row>
      <Row label="Verbal (1-5)"><NumInput value={v} onChange={setV} min={1} max={5} /></Row>
      <Row label="Motor (1-6)"><NumInput value={m} onChange={setM} min={1} max={6} /></Row>
      <Result label="GCS" value={`${total}/15 — ${sev}`} color={total >= 13 ? 'green' : total >= 9 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function BMICalc() {
  const [wt, setWt] = useState<number | ''>(70);
  const [ht, setHt] = useState<number | ''>(170);
  const bmi = (Number(wt) && Number(ht)) ? Number(wt) / Math.pow(Number(ht) / 100, 2) : 0;
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  return (
    <CalcCard title="BMI">
      <Row label="Weight (kg)"><NumInput value={wt} onChange={setWt} /></Row>
      <Row label="Height (cm)"><NumInput value={ht} onChange={setHt} /></Row>
      {bmi > 0 && <Result label="BMI" value={`${bmi.toFixed(1)} — ${cat}`} color={bmi < 25 ? 'green' : bmi < 30 ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}

function GFRCalc() {
  const [cr, setCr] = useState<number | ''>(80);
  const [age, setAge] = useState<number | ''>(50);
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const creat = Number(cr);
  const ageVal = Number(age);
  let gfr = 0;
  if (creat && ageVal) {
    const k = sex === 'F' ? 0.7 : 0.9;
    const a = sex === 'F' ? -0.241 : -0.302;
    const sexFactor = sex === 'F' ? 1.012 : 1;
    const cr_k = creat / 88.4 / k;
    gfr = 142 * Math.pow(Math.min(cr_k, 1), a) * Math.pow(Math.max(cr_k, 1), -1.200) * Math.pow(0.9938, ageVal) * sexFactor;
  }
  const stage = gfr >= 90 ? 'G1' : gfr >= 60 ? 'G2' : gfr >= 45 ? 'G3a' : gfr >= 30 ? 'G3b' : gfr >= 15 ? 'G4' : 'G5';
  return (
    <CalcCard title="eGFR (CKD-EPI 2021)">
      <Row label="Creatinine (µmol/L)"><NumInput value={cr} onChange={setCr} /></Row>
      <Row label="Age (years)"><NumInput value={age} onChange={setAge} /></Row>
      <Row label="Sex">
        <select value={sex} onChange={e => setSex(e.target.value as 'M' | 'F')} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900">
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </Row>
      {gfr > 0 && <Result label="eGFR" value={`${gfr.toFixed(0)} mL/min/1.73m² — CKD ${stage}`} color={gfr >= 60 ? 'green' : gfr >= 30 ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}

function AKICalc() {
  const [baseline, setBaseline] = useState<number | ''>('');
  const [current, setCurrent] = useState<number | ''>('');
  const [urine, setUrine] = useState<number | ''>('');
  const [hours, setHours] = useState<number | ''>('');
  const b = Number(baseline);
  const c = Number(current);
  const u = Number(urine);
  const h = Number(hours);

  // KDIGO staging: creatinine criterion and urine-output criterion — take the worse.
  let crStage = 0;
  if (b > 0 && c > 0) {
    const ratio = c / b;
    if (ratio >= 3 || c >= 353.6) crStage = 3;
    else if (ratio >= 2) crStage = 2;
    else if (ratio >= 1.5 || c - b >= 26.5) crStage = 1;
  }
  let uoStage = 0;
  if (u > 0 && h > 0) {
    if (u < 0.3 && h >= 24) uoStage = 3;
    else if (u < 0.5 && h >= 12) uoStage = 2;
    else if (u < 0.5 && h >= 6) uoStage = 1;
  }
  const stage = Math.max(crStage, uoStage);
  const assessed = (b > 0 && c > 0) || (u > 0 && h > 0);
  const advice =
    stage === 0
      ? 'No AKI by KDIGO criteria on these values'
      : `KDIGO Stage ${stage} AKI — hold nephrotoxics (NSAIDs, ACE-i/ARB, aminoglycosides, contrast), review drug doses for renal clearance, strict fluid balance${stage >= 2 ? ', urgent senior review' : ''}${stage === 3 ? ', consider dialysis referral criteria' : ''}`;

  return (
    <CalcCard title="AKI Staging (KDIGO)">
      <Row label="Baseline creatinine (µmol/L)"><NumInput value={baseline} onChange={setBaseline} placeholder="e.g. 80" /></Row>
      <Row label="Current creatinine (µmol/L)"><NumInput value={current} onChange={setCurrent} placeholder="e.g. 160" /></Row>
      <Row label="Urine output (mL/kg/h)"><NumInput value={urine} onChange={setUrine} placeholder="optional" /></Row>
      <Row label="Over how many hours"><NumInput value={hours} onChange={setHours} placeholder="optional" /></Row>
      {assessed && (
        <Result
          label="KDIGO"
          value={stage === 0 ? 'No AKI' : `Stage ${stage} AKI`}
          color={stage === 0 ? 'green' : stage === 1 ? 'yellow' : 'red'}
        />
      )}
      {assessed && <p className="text-xs text-gray-500 leading-relaxed mt-2">{advice}</p>}
    </CalcCard>
  );
}

function QSOFACalc() {
  const [rr, setRr] = useState(0);
  const [ms, setMs] = useState(0);
  const [sbp, setSbp] = useState(0);
  const score = rr + ms + sbp;
  return (
    <CalcCard title="qSOFA Score">
      {[
        ['RR ≥22/min', rr, setRr],
        ['Altered mental status (GCS < 15)', ms, setMs],
        ['SBP ≤100 mmHg', sbp, setSbp],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <input type="checkbox" checked={val === 1} onChange={e => (setter as (v: number) => void)(e.target.checked ? 1 : 0)} className="accent-blue-500 w-4 h-4" />
        </Row>
      ))}
      <Result label="qSOFA" value={`${score}/3 — ${score >= 2 ? 'HIGH risk (consider sepsis workup)' : 'Low risk'}`} color={score >= 2 ? 'red' : 'green'} />
    </CalcCard>
  );
}

function SOFACalc() {
  const [resp, setResp] = useState<number | ''>(0);
  const [coag, setCoag] = useState<number | ''>(0);
  const [liver, setLiver] = useState<number | ''>(0);
  const [cardio, setCardio] = useState<number | ''>(0);
  const [cns, setCns] = useState<number | ''>(0);
  const [renal, setRenal] = useState<number | ''>(0);
  const total = [resp, coag, liver, cardio, cns, renal].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const mort = total <= 1 ? '<10%' : total <= 5 ? '15-20%' : total <= 9 ? '40%' : total <= 11 ? '50-60%' : '>80%';
  return (
    <CalcCard title="SOFA Score (Sequential Organ Failure Assessment)">
      {[
        ['Respiratory (0-4)', resp, setResp],
        ['Coagulation (0-4)', coag, setCoag],
        ['Liver (0-4)', liver, setLiver],
        ['Cardiovascular (0-4)', cardio, setCardio],
        ['CNS/GCS (0-4)', cns, setCns],
        ['Renal (0-4)', renal, setRenal],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={4} />
        </Row>
      ))}
      <Result label="SOFA" value={`${total}/24 — Mortality ~${mort}`} color={total >= 10 ? 'red' : total >= 5 ? 'yellow' : 'green'} />
    </CalcCard>
  );
}

function HEARTCalc() {
  const [h, setH] = useState<number | ''>(0);
  const [e, setE] = useState<number | ''>(0);
  const [a, setA] = useState<number | ''>(0);
  const [r, setR] = useState<number | ''>(0);
  const [t, setT] = useState<number | ''>(0);
  const score = [h, e, a, r, t].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const risk = score <= 3 ? 'Low' : score <= 6 ? 'Moderate' : 'High';
  return (
    <CalcCard title="HEART Score (Chest Pain)">
      <p className="text-xs text-gray-400 mb-2">Each component scored 0-2</p>
      {[
        ['History (0-2)', h, setH],
        ['ECG (0-2)', e, setE],
        ['Age (0-2)', a, setA],
        ['Risk Factors (0-2)', r, setR],
        ['Troponin (0-2)', t, setT],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={2} />
        </Row>
      ))}
      <Result label="HEART" value={`${score}/10 — ${risk} risk`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function WellsPECalc() {
  const criteria = [
    ['Clinical signs/symptoms of DVT (+3)', 3],
    ['PE is #1 diagnosis, or equally likely (+3)', 3],
    ['HR > 100 (+1.5)', 1.5],
    ['Immobilisation ≥3 days / surgery in 4wk (+1.5)', 1.5],
    ['Previous DVT/PE (+1.5)', 1.5],
    ['Haemoptysis (+1)', 1],
    ['Malignancy (+1)', 1],
  ];
  const [scores, setScores] = useState<boolean[]>(Array(criteria.length).fill(false));
  const total = criteria.reduce<number>((s, [, v], i) => s + (scores[i] ? (v as number) : 0), 0);
  const risk = total > 6 ? 'High' : total > 2 ? 'Moderate' : 'Low';
  return (
    <CalcCard title="Wells' PE Score">
      {criteria.map(([label], i) => (
        <Row key={i} label={label as string}>
          <input type="checkbox" checked={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = e.target.checked; setScores(ns); }} className="accent-blue-500 w-4 h-4" />
        </Row>
      ))}
      <Result label="Wells PE" value={`${total} — ${risk} probability`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function WellsDVTCalc() {
  const criteria = [
    ['Active cancer (+1)', 1], ['Paralysis/cast (+1)', 1],
    ['Bedridden >3d / surgery <12wk (+1)', 1], ['Entire leg swelling (+1)', 1],
    ['Calf swelling >3cm (+1)', 1], ['Pitting oedema (+1)', 1],
    ['Collateral superficial veins (+1)', 1], ['Previous DVT (+1)', 1],
    ['Alternative diagnosis as likely (-2)', -2],
  ];
  const [scores, setScores] = useState<boolean[]>(Array(criteria.length).fill(false));
  const total = criteria.reduce<number>((s, [, v], i) => s + (scores[i] ? (v as number) : 0), 0);
  const risk = total >= 3 ? 'High' : total >= 1 ? 'Moderate' : 'Low';
  return (
    <CalcCard title="Wells' DVT Score">
      {criteria.map(([label], i) => (
        <Row key={i} label={label as string}>
          <input type="checkbox" checked={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = e.target.checked; setScores(ns); }} className="accent-blue-500 w-4 h-4" />
        </Row>
      ))}
      <Result label="Wells DVT" value={`${total} — ${risk} probability`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function CRB65Calc() {
  const [c, setC] = useState(0);
  const [r, setR] = useState(0);
  const [b, setB] = useState(0);
  const [age, setAge] = useState(0);
  const score = c + r + b + age;
  const mort = score === 0 ? '<1%' : score === 1 ? '1-5%' : score === 2 ? '5-10%' : score === 3 ? '15-25%' : '>30%';
  return (
    <CalcCard title="CRB-65 (Pneumonia Severity)">
      {[
        ['Confusion (+1)', c, setC],
        ['RR ≥30 (+1)', r, setR],
        ['BP sys <90 or dia ≤60 (+1)', b, setB],
        ['Age ≥65 (+1)', age, setAge],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <input type="checkbox" checked={val === 1} onChange={e => (setter as (v: number) => void)(e.target.checked ? 1 : 0)} className="accent-blue-500 w-4 h-4" />
        </Row>
      ))}
      <Result label="CRB-65" value={`${score}/4 — 30-day mortality ~${mort}`} color={score === 0 ? 'green' : score <= 2 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function PHQ9Calc() {
  const items = ['Little interest/pleasure', 'Feeling down/hopeless', 'Sleep problems', 'Tired/little energy', 'Poor appetite/overeating', 'Feeling bad about yourself', 'Concentration difficulties', 'Moving/speaking slowly or restless', 'Thoughts of self-harm'];
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const sev = total <= 4 ? 'Minimal' : total <= 9 ? 'Mild' : total <= 14 ? 'Moderate' : total <= 19 ? 'Moderately Severe' : 'Severe';
  return (
    <CalcCard title="PHQ-9 Depression Screen">
      {items.map((item, i) => (
        <Row key={i} label={`${i + 1}. ${item}`}>
          <select value={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = Number(e.target.value); setScores(ns); }} className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900">
            <option value={0}>0 - Not at all</option>
            <option value={1}>1 - Several days</option>
            <option value={2}>2 - More than half</option>
            <option value={3}>3 - Nearly every day</option>
          </select>
        </Row>
      ))}
      <Result label="PHQ-9" value={`${total}/27 — ${sev} depression`} color={total <= 4 ? 'green' : total <= 9 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function BishopCalc() {
  const [dil, setDil] = useState<number | ''>(0);
  const [eff, setEff] = useState<number | ''>(0);
  const [sta, setSta] = useState<number | ''>(0);
  const [con, setCon] = useState<number | ''>(0);
  const [pos, setPos] = useState<number | ''>(0);
  const score = [dil, eff, sta, con, pos].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const favour = score >= 8 ? 'Favourable (induction likely successful)' : score >= 6 ? 'Borderline' : 'Unfavourable (consider cervical ripening)';
  return (
    <CalcCard title="Bishop Score (Cervical Assessment)">
      {[
        ['Dilatation 0-3cm (0-3)', dil, setDil, 3],
        ['Effacement 0-80% (0-3)', eff, setEff, 3],
        ['Station -3 to +2 (0-3)', sta, setSta, 3],
        ['Consistency (0-2)', con, setCon, 2],
        ['Position (0-2)', pos, setPos, 2],
      ].map(([label, val, setter, mx]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={mx as number} />
        </Row>
      ))}
      <Result label="Bishop Score" value={`${score}/13 — ${favour}`} color={score >= 8 ? 'green' : score >= 6 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function APGARCalc() {
  const [a, setA] = useState<number | ''>(2);
  const [p, setP] = useState<number | ''>(2);
  const [g, setG] = useState<number | ''>(2);
  const [ar, setAr] = useState<number | ''>(2);
  const [r, setR] = useState<number | ''>(2);
  const score = [a, p, g, ar, r].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const interp = score >= 7 ? 'Normal' : score >= 4 ? 'Requires intervention' : 'Resuscitation needed';
  return (
    <CalcCard title="APGAR Score">
      {[
        ['Appearance (0-2)', a, setA],
        ['Pulse (0-2)', p, setP],
        ['Grimace (0-2)', g, setG],
        ['Activity (0-2)', ar, setAr],
        ['Respiration (0-2)', r, setR],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={2} />
        </Row>
      ))}
      <Result label="APGAR" value={`${score}/10 — ${interp}`} color={score >= 7 ? 'green' : score >= 4 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function EddGaCalc() {
  const [lmp, setLmp] = useState('');
  const [usDays, setUsDays] = useState<number | ''>('');
  const today = new Date();

  let gaByLmp = '';
  let eddByLmp = '';
  if (lmp) {
    const lmpDate = new Date(lmp);
    const daysDiff = Math.floor((today.getTime() - lmpDate.getTime()) / 86400000);
    const weeks = Math.floor(daysDiff / 7);
    const days = daysDiff % 7;
    gaByLmp = `${weeks}+${days} weeks`;
    const edd = new Date(lmpDate.getTime() + 280 * 86400000);
    eddByLmp = edd.toLocaleDateString();
  }

  return (
    <CalcCard title="EDD / Gestational Age">
      <Row label="LMP Date">
        <input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 w-full" />
      </Row>
      {gaByLmp && <Result label="GA by LMP" value={gaByLmp} color="pink" />}
      {eddByLmp && <Result label="EDD by LMP (Naegele)" value={eddByLmp} color="pink" />}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="US GA (days)"><NumInput value={usDays} onChange={setUsDays} placeholder="e.g. 200" /></Row>
        {usDays !== '' && Number(usDays) > 0 && (
          <Result label="GA from US" value={`${Math.floor(Number(usDays) / 7)}+${Number(usDays) % 7} weeks`} color="pink" />
        )}
      </div>
    </CalcCard>
  );
}

function MEOWSCalc() {
  const [rr, setRr] = useState<number | ''>(18);
  const [spo2, setSpo2] = useState<number | ''>(98);
  const [sbp, setSbp] = useState<number | ''>(120);
  const [hr, setHr] = useState<number | ''>(80);
  const [temp, setTemp] = useState<number | ''>(37);
  const [avpu, setAvpu] = useState('A');

  let score = 0;
  const rrN = Number(rr); const spo2N = Number(spo2); const sbpN = Number(sbp);
  const hrN = Number(hr); const tempN = Number(temp);

  if (rrN < 10 || rrN > 29) score++;
  if (rrN < 5 || rrN > 35) score += 2;
  if (spo2N < 95) score++;
  if (spo2N < 92) score += 2;
  if (sbpN < 90 || sbpN > 160) score++;
  if (sbpN < 80) score += 2;
  if (hrN < 50 || hrN > 110) score++;
  if (hrN < 40 || hrN > 130) score += 2;
  if (tempN < 36 || tempN > 38) score++;
  if (avpu !== 'A') score++;
  if (avpu === 'U' || avpu === 'P') score++;

  const risk = score <= 2 ? 'Routine' : score <= 4 ? 'Increase observation' : score <= 6 ? 'Medical review' : 'Emergency';

  return (
    <CalcCard title="MEOWS (Modified Early Obstetric Warning Score)">
      <Row label="RR (/min)"><NumInput value={rr} onChange={setRr} /></Row>
      <Row label="SpO2 (%)"><NumInput value={spo2} onChange={setSpo2} /></Row>
      <Row label="SBP (mmHg)"><NumInput value={sbp} onChange={setSbp} /></Row>
      <Row label="HR (/min)"><NumInput value={hr} onChange={setHr} /></Row>
      <Row label="Temp (°C)"><NumInput value={temp} onChange={setTemp} /></Row>
      <Row label="AVPU">
        <select value={avpu} onChange={e => setAvpu(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900">
          <option value="A">Alert</option>
          <option value="V">Voice</option>
          <option value="P">Pain</option>
          <option value="U">Unresponsive</option>
        </select>
      </Row>
      <Result label="MEOWS" value={`${score} — ${risk}`} color={score <= 2 ? 'green' : score <= 4 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}

function EPDSCalc() {
  const items = [
    'Able to laugh and see funny side of things',
    'Looked forward with enjoyment to things',
    'Blamed self unnecessarily when things go wrong',
    'Anxious or worried for no good reason',
    'Scared or panicky for no good reason',
    'Things getting on top of me',
    'Unhappy: difficulty sleeping',
    'Felt sad or miserable',
    'Unhappy that I have been crying',
    'Thought of harming myself',
  ];
  const [scores, setScores] = useState<number[]>(Array(10).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const risk = total >= 13 ? 'Likely depression — urgent review' : total >= 10 ? 'Possible depression — review needed' : 'Low risk';
  return (
    <CalcCard title="EPDS (Edinburgh Postnatal Depression Scale)">
      {items.map((item, i) => (
        <Row key={i} label={`${i + 1}. ${item}`}>
          <select value={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = Number(e.target.value); setScores(ns); }} className="bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 w-full">
            <option value={0}>0</option><option value={1}>1</option>
            <option value={2}>2</option><option value={3}>3</option>
          </select>
        </Row>
      ))}
      <Result label="EPDS" value={`${total}/30 — ${risk}`} color={total >= 13 ? 'red' : total >= 10 ? 'yellow' : 'green'} />
      {scores[9] > 0 && <p className="text-red-400 text-xs mt-2 font-medium">⚠️ Q10 positive — assess for self-harm risk immediately</p>}
    </CalcCard>
  );
}

function RMICalc() {
  const [us, setUs] = useState<number | ''>(0);
  const [meno, setMeno] = useState(0);
  const [ca125, setCa125] = useState<number | ''>(0);
  const m = meno === 0 ? 1 : 3;
  const rmi = Number(us) * m * Number(ca125);
  const risk = rmi < 200 ? 'Low' : rmi < 1000 ? 'Moderate' : 'High';
  return (
    <CalcCard title="RMI (Risk of Malignancy Index)">
      <p className="text-xs text-gray-400 mb-2">RMI = US score × M × CA-125</p>
      <Row label="US score (0/1/3)"><NumInput value={us} onChange={setUs} min={0} max={3} /></Row>
      <Row label="Postmenopausal">
        <input type="checkbox" checked={meno === 1} onChange={e => setMeno(e.target.checked ? 1 : 0)} className="accent-blue-500 w-4 h-4" />
      </Row>
      <Row label="CA-125 (U/mL)"><NumInput value={ca125} onChange={setCa125} /></Row>
      {rmi > 0 && <Result label="RMI" value={`${rmi.toFixed(0)} — ${risk} malignancy risk`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}

function PCOSCalc() {
  const [oligo, setOligo] = useState(false);
  const [hyper, setHyper] = useState(false);
  const [pcosMorph, setPcosMorph] = useState(false);
  const criteria = [oligo, hyper, pcosMorph].filter(Boolean).length;
  const diagnosis = criteria >= 2 ? 'PCOS likely (Rotterdam ≥2/3)' : 'PCOS unlikely (< 2/3 criteria)';
  return (
    <CalcCard title="PCOS — Rotterdam Criteria">
      <Row label="Oligomenorrhoea / anovulation">
        <input type="checkbox" checked={oligo} onChange={e => setOligo(e.target.checked)} className="accent-blue-500 w-4 h-4" />
      </Row>
      <Row label="Clinical/biochemical hyperandrogenism">
        <input type="checkbox" checked={hyper} onChange={e => setHyper(e.target.checked)} className="accent-blue-500 w-4 h-4" />
      </Row>
      <Row label="Polycystic ovaries on USS">
        <input type="checkbox" checked={pcosMorph} onChange={e => setPcosMorph(e.target.checked)} className="accent-blue-500 w-4 h-4" />
      </Row>
      <Result label="Rotterdam" value={`${criteria}/3 — ${diagnosis}`} color={criteria >= 2 ? 'yellow' : 'green'} />
    </CalcCard>
  );
}

function PCOSHormonesCalc() {
  const [lh, setLh] = useState<number | ''>('');
  const [fsh, setFsh] = useState<number | ''>('');
  const [testo, setTesto] = useState<number | ''>('');
  const [shbg, setShbg] = useState<number | ''>('');
  const [insulin, setInsulin] = useState<number | ''>('');
  const [glucose, setGlucose] = useState<number | ''>('');

  const ratio = (Number(lh) && Number(fsh)) ? (Number(lh) / Number(fsh)).toFixed(2) : null;
  const fai = (Number(testo) && Number(shbg)) ? ((Number(testo) / Number(shbg)) * 100).toFixed(1) : null;
  const homa = (Number(insulin) && Number(glucose)) ? ((Number(insulin) * Number(glucose)) / 22.5).toFixed(2) : null;

  return (
    <CalcCard title="PCOS Hormonal Panel">
      <Row label="LH (IU/L)"><NumInput value={lh} onChange={setLh} placeholder="e.g. 10" /></Row>
      <Row label="FSH (IU/L)"><NumInput value={fsh} onChange={setFsh} placeholder="e.g. 5" /></Row>
      {ratio && <Result label="LH:FSH Ratio" value={`${ratio} ${Number(ratio) > 2 ? '(Elevated — PCOS pattern)' : '(Normal)'}`} color={Number(ratio) > 2 ? 'yellow' : 'green'} />}

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Total Testosterone (nmol/L)"><NumInput value={testo} onChange={setTesto} /></Row>
        <Row label="SHBG (nmol/L)"><NumInput value={shbg} onChange={setShbg} /></Row>
        {fai && <Result label="FAI (Free Androgen Index)" value={`${fai}% ${Number(fai) > 4.5 ? '(Elevated)' : '(Normal)'}`} color={Number(fai) > 4.5 ? 'yellow' : 'green'} />}
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Fasting Insulin (pmol/L)"><NumInput value={insulin} onChange={setInsulin} /></Row>
        <Row label="Fasting Glucose (mmol/L)"><NumInput value={glucose} onChange={setGlucose} /></Row>
        {homa && <Result label="HOMA-IR" value={`${homa} ${Number(homa) > 2.5 ? '(Insulin Resistance)' : '(Normal)'}`} color={Number(homa) > 2.5 ? 'yellow' : 'green'} />}
      </div>
    </CalcCard>
  );
}

function EctopicCalc() {
  const [hcg1, setHcg1] = useState<number | ''>('');
  const [hcg2, setHcg2] = useState<number | ''>('');
  const [prog, setProg] = useState<number | ''>('');
  const [days, setDays] = useState<number | ''>(48);

  const rise = (Number(hcg1) && Number(hcg2) && Number(days))
    ? (((Number(hcg2) - Number(hcg1)) / Number(hcg1)) * 100).toFixed(1)
    : null;

  const expectedRise = Number(days) >= 48 ? 53 : 66;
  const riseOk = rise ? Number(rise) >= expectedRise : null;

  const mtxEligible = Number(hcg1) < 5000 && Number(prog) < 20;

  return (
    <CalcCard title="Ectopic Pregnancy Assessment">
      <Row label="hCG #1 (IU/L)"><NumInput value={hcg1} onChange={setHcg1} placeholder="e.g. 500" /></Row>
      <Row label="hCG #2 (IU/L)"><NumInput value={hcg2} onChange={setHcg2} placeholder="e.g. 900" /></Row>
      <Row label="Interval (hours)"><NumInput value={days} onChange={setDays} placeholder="48" /></Row>
      {rise !== null && (
        <Result
          label="hCG rise"
          value={`${rise}% over ${days}h — ${riseOk ? 'Normal IUP pattern' : 'Abnormal (ectopic/miscarriage likely)'}`}
          color={riseOk ? 'green' : 'red'}
        />
      )}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Progesterone (nmol/L)"><NumInput value={prog} onChange={setProg} placeholder="e.g. 15" /></Row>
        {Number(hcg1) > 0 && Number(prog) > 0 && (
          <Result
            label="MTX Eligibility"
            value={mtxEligible ? 'Potentially eligible (hCG<5000 & Prog<20)' : 'Check criteria — not straightforward'}
            color={mtxEligible ? 'green' : 'yellow'}
          />
        )}
      </div>
    </CalcCard>
  );
}

function FertilityCalc() {
  const [midLutP, setMidLutP] = useState<number | ''>('');
  const [amh, setAmh] = useState<number | ''>('');
  const [day3Fsh, setDay3Fsh] = useState<number | ''>('');

  const ovConfirmed = Number(midLutP) >= 16;
  const ovarianReserve = Number(amh) < 5.4 ? 'Low' : Number(amh) > 25 ? 'High' : 'Normal';
  const fshNormal = Number(day3Fsh) < 10;

  return (
    <CalcCard title="Fertility Workup Interpretation">
      <Row label="Mid-luteal Progesterone (nmol/L)"><NumInput value={midLutP} onChange={setMidLutP} placeholder="e.g. 25" /></Row>
      {Number(midLutP) > 0 && (
        <Result label="Ovulation" value={ovConfirmed ? 'Confirmed (P ≥16)' : 'Uncertain (P <16 — anovulatory?)'} color={ovConfirmed ? 'green' : 'yellow'} />
      )}

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="AMH (pmol/L)"><NumInput value={amh} onChange={setAmh} placeholder="e.g. 14" /></Row>
        {Number(amh) > 0 && (
          <Result label="Ovarian Reserve (AMH)" value={ovarianReserve} color={ovarianReserve === 'Normal' ? 'green' : ovarianReserve === 'Low' ? 'red' : 'yellow'} />
        )}
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Day 3 FSH (IU/L)"><NumInput value={day3Fsh} onChange={setDay3Fsh} placeholder="e.g. 7" /></Row>
        {Number(day3Fsh) > 0 && (
          <Result label="Day 3 FSH" value={fshNormal ? 'Normal (<10 IU/L)' : 'Elevated (≥10) — reduced reserve'} color={fshNormal ? 'green' : 'red'} />
        )}
      </div>
    </CalcCard>
  );
}

// ─── MAIN TOOLS APP ──────────────────────────────────────────────────────────

export function ToolsApp({ onBack }: { onBack: () => void }) {
  // Hydrate the whole working set from localStorage so a refresh, tab
  // discard, or phone-browser eviction never loses a round's worth of data.
  const persisted = useRef(storage.getToolsState()).current;
  const [key, setKey] = useState(storage.getToolsKey());
  const [dept, setDept] = useState<DeptId | null>(
    (persisted?.dept as DeptId | null) ?? null
  );
  const [patients, setPatients] = useState<Patient[]>(
    (persisted?.patients as Patient[] | undefined) ?? []
  );
  const [activePatientId, setActivePatientId] = useState<string | null>(
    persisted?.activePatientId ?? null
  );
  const [activeTab, setActiveTab] = useState<Tab>('intake');

  useEffect(() => {
    storage.setToolsState({ dept, patients, activePatientId });
  }, [dept, patients, activePatientId]);

  function handleKey(k: string) {
    storage.setToolsKey(k);
    setKey(k);
  }

  function selectDept(d: DeptId) {
    setDept(d);
    // Keep existing patients when returning to a department; only seed the
    // first patient on a genuinely empty board.
    if (patients.length === 0) {
      const p = newPatient(d);
      setPatients([p]);
      setActivePatientId(p.id);
    } else if (!activePatientId) {
      setActivePatientId(patients[0].id);
    }
  }

  function addPatient() {
    if (!dept) return;
    const p = newPatient(dept);
    setPatients(prev => [...prev, p]);
    setActivePatientId(p.id);
    setActiveTab('intake');
  }

  function removePatient(id: string) {
    setPatients(prev => {
      const next = prev.filter(p => p.id !== id);
      if (activePatientId === id) {
        setActivePatientId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  if (!key) {
    return (
      <AccessKeyGate
        label="Intern Tools — enter your tools key"
        storageKey="medai_tools_key"
        onKey={handleKey}
        validate={toolsApi.validate}
      />
    );
  }

  if (!dept) {
    return <DeptSelector onSelect={selectDept} />;
  }

  const activePatient = patients.find(p => p.id === activePatientId);
  const deptInfo = DEPARTMENTS.find(d => d.id === dept)!;

  const tabs = ([
    { id: 'intake' as Tab, label: 'Intake' },
    { id: 'history' as Tab, label: 'History' },
    { id: 'assessment' as Tab, label: 'Assessment' },
    { id: 'problems' as Tab, label: `Problems (${activePatient?.problems.length ?? 0})` },
    { id: 'round' as Tab, label: 'Round Note' },
    { id: 'formulas' as Tab, label: 'Calculators' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'specialist' as Tab, label: 'Specialist', show: dept === 'og' },
  ] as { id: Tab; label: string; show?: boolean }[]).filter(t => t.show !== false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 transition-colors">←</button>
        <img src="/medai-icon.svg" alt="" className="w-7 h-7" />
        <span className="text-gray-900 font-semibold">Intern Tools</span>
        <span className="text-gray-400 text-sm">·</span>
        <button
          onClick={() => setDept(null)}
          className="text-sm text-gray-500 hover:text-gray-900 bg-gray-100 px-2 py-0.5 rounded transition-colors"
        >
          {deptInfo.icon} {deptInfo.label}
        </button>
        <div className="flex-1" />
        <button
          onClick={addPatient}
          className="text-sm bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          + Patient
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — patient list */}
        {patients.length > 1 && (
          <aside className="w-48 border-r border-gray-200 overflow-y-auto shrink-0 bg-gray-50">
            <div className="p-2 space-y-1">
              {patients.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setActivePatientId(p.id); setActiveTab('intake'); }}
                    className={`flex-1 text-left text-xs px-2 py-2 rounded-lg transition-colors truncate ${
                      activePatientId === p.id
                        ? 'bg-teal-600 text-white'
                        : 'text-gray-600 hover:bg-white'
                    }`}
                  >
                    {p.intake.name || `Patient ${i + 1}`}
                  </button>
                  {patients.length > 1 && (
                    <button
                      onClick={() => removePatient(p.id)}
                      className="text-gray-400 hover:text-red-400 px-1"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 flex overflow-x-auto shrink-0">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === t.id
                    ? 'text-teal-700 border-b-2 border-teal-500 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-5 py-8">
            {activePatient ? (
              <div className="max-w-3xl mx-auto">
                {activeTab === 'intake' && (
                  <IntakeTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    onChange={patch => updatePatient(activePatient.id, { intake: { ...activePatient.intake, ...patch } })}
                  />
                )}
                {activeTab === 'history' && (
                  <HistoryTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    onChange={patch => updatePatient(activePatient.id, { history: { ...activePatient.history, ...patch } })}
                  />
                )}
                {activeTab === 'assessment' && (
                  <AssessmentTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    onChange={patch => updatePatient(activePatient.id, { assessment: { ...activePatient.assessment, ...patch } })}
                    onAdmNote={note => updatePatient(activePatient.id, { admissionNote: note })}
                  />
                )}
                {activeTab === 'problems' && (
                  <ProblemsTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    problems={activePatient.problems}
                    onChange={problems => updatePatient(activePatient.id, { problems })}
                  />
                )}
                {activeTab === 'round' && (
                  <RoundTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    onChange={patch => updatePatient(activePatient.id, { roundData: { ...activePatient.roundData, ...patch } })}
                    onLog={note => updatePatient(activePatient.id, {
                      progressLog: [
                        ...(activePatient.progressLog ?? []),
                        { date: new Date().toISOString().slice(0, 10), note },
                      ],
                    })}
                  />
                )}
                {activeTab === 'formulas' && <FormulasTab dept={dept} patient={activePatient} />}
                {activeTab === 'documents' && (
                  <DocumentsTab key={activePatient.id} patient={activePatient} toolsKey={key} dept={dept} />
                )}
                {activeTab === 'specialist' && (
                  <SpecialistTab key={activePatient.id} patient={activePatient} toolsKey={key} dept={dept} />
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">👤</p>
                <p>No patient selected</p>
                <button onClick={addPatient} className="mt-3 text-teal-600 text-sm hover:text-teal-700">
                  + Add patient
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
