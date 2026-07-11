import type { AssistField, Problem, RoundNote, WardRoundUpdate } from '../toolsApi';

// ─── Patient data interfaces ────────────────────────────────────────────────

export interface IntakeData {
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

export interface HistoryData {
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

export interface AssessmentData {
  vitals: string;
  generalExam?: string;
  examination: string;
  investigations: string;
  dayOfAdmission: string;
  // dept-specific fields (SFH, Leopold's, FHR, MSE, primary survey, ...)
  [key: string]: string | undefined;
}

export interface RoundData {
  plan: string;
  pending: string;
  subjective: string;
  generatedNote?: RoundNote;
}

// ─── Structured-input persistence (all ADDITIVE + optional so previously ────
// saved patients keep loading unchanged). Raw block/chip selections are kept
// per patient so re-opening restores them; the serialized text they produced
// already lives in the record string fields the AI endpoints consume.

export interface CascadePersist {
  selections: Record<string, string[]>;
  customNote: string;
  /** Last serialized text written into the record — replaced on next change. */
  lastText?: string;
}

export interface SmartBlockPersist {
  state: Record<string, string | boolean | undefined>;
  customNote: string;
  lastText?: string;
}

export interface ExamChecklistPersist {
  /** Legacy tick state (pre values-first capture) — kept so old records load. */
  checked: Record<string, boolean>;
  /** itemId → captured value ('NAD' or the actual finding / vital reading). */
  values?: Record<string, string>;
  customNote: string;
  /** Last serialized findings block upserted into assessment.examination. */
  lastText?: string;
  /** Last serialized vitals line upserted into assessment.vitals. */
  vitalsLastText?: string;
}

export interface ImageFinding {
  modality: string;
  injectText: string;
  date: string;
}

export interface Patient {
  id: string;
  intake: IntakeData;
  history: HistoryData;
  assessment: AssessmentData;
  problems: Problem[];
  roundData: RoundData;
  // one entry per generated ward-round note — the record's day-by-day story
  progressLog?: { date: string; note: string }[];
  // structured zero-typing inputs (all optional — backward compatible)
  activeCascadeId?: string;
  cascades?: Record<string, CascadePersist>;
  smartBlocks?: Record<string, SmartBlockPersist>;
  examChecklist?: ExamChecklistPersist;
  imageFindings?: ImageFinding[];
  // tap-stream answers (Confirm step) — keyed by a stable hash of the
  // DiscriminatingFeature's prompt, value is 'yes'|'no' or the chosen MCQ
  // option. The serialized text these produce already lives in history.hpi /
  // assessment.examination; this map just lets re-answering find + replace
  // the right line and lets the UI show which taps are already answered.
  featureAnswers?: Record<string, string>;
  // saved HOD-round syntheses, oldest first
  rounds?: WardRoundUpdate[];
  // serial investigations — trended across the admission (optional, backward compatible)
  investigations?: import('../lib/investigations').InvestigationEntry[];
  // the live working diagnostic picture (the bedside loop). Persisted so the
  // Clerk builds it and the Results tab updates it against new results.
  workingPicture?: import('../toolsApi').WorkingPicture;
  // practice-patient flag: scenario/med-student use, kept out of anything real
  practice?: boolean;
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

// ─── Per-department field fragments ─────────────────────────────────────────
// A department contributes extra fields to the base builders through these
// fragments: intake fields are appended after the base list; history and
// assessment fields are spliced into the base list at a fixed position so the
// reading order matches the clinical routine. Adding a new specialty means
// adding a file in fields/departments/ and registering it — the base builders
// never change.

export interface SplicedFields<D> {
  /** Index in the base field list where this department's fields are inserted. */
  insertAt: number;
  fields: (d: D, subDept?: string) => AssistField[];
}

export interface DeptFieldFragments {
  /** Appended after the base intake fields. */
  intake?: (d: IntakeData) => AssistField[];
  history?: SplicedFields<HistoryData>;
  assessment?: SplicedFields<AssessmentData>;
}
