import { useEffect, useRef, useState } from 'react';
import {
  toolsApi,
  type HospitalProtocolSummary,
  type LegalFormDraft,
  type LegalFormSection,
  type LegalFormType,
} from '../toolsApi';
import { DEPARTMENTS, type DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { AiBtn, DocOutput, SectionHead, copy } from '../components/ui';

// ─── DOCUMENTS TAB ──────────────────────────────────────────────────────────

export function DocumentsTab({ patient, toolsKey, dept }: {
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
      // Include the problem list so every document reflects the intern's working
      // diagnosis, differentials and management plan — not just the raw clerking.
      const base = {
        dept,
        ...patient.intake,
        ...patient.history,
        ...patient.assessment,
        problems: patient.problems.map(p => ({
          problem: p.problem,
          workingDx: p.workingDx,
          differentials: p.differentials,
          management: p.management,
        })),
      };

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
      <LegalFormsPanel patient={patient} toolsKey={toolsKey} dept={dept} />

      <HospitalProtocolsPanel toolsKey={toolsKey} dept={dept} />

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

      {err && <p className="text-band-exclude text-xs">{err}</p>}

      {docs.map(d =>
        results[d.id] ? (
          <div key={d.id}>
            <p className="text-xs font-medium text-ink-mute mb-1">{d.label}</p>
            <DocOutput text={results[d.id]} />
          </div>
        ) : null
      )}
    </div>
  );
}

// ─── HOSPITAL PROTOCOLS ─────────────────────────────────────────────────────
// A facility's own protocols, plugged in as a resource for this department:
// once uploaded (pasted text or a PDF/txt file), every AI-assist question,
// notes scan, and problem suggestion for this department can pull in the
// matching excerpt — and is instructed to follow it over the generic SA STG
// where the two differ. Not per-patient — shared across the department.

function HospitalProtocolsPanel({ toolsKey, dept }: { toolsKey: string; dept: DeptId }) {
  const [protocols, setProtocols] = useState<HospitalProtocolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await toolsApi.listProtocols(toolsKey, dept);
      setProtocols(res.protocols);
    } catch {
      // Quiet — this is a supplementary panel, not core patient data.
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  async function add() {
    if (!title.trim()) { setErr('Give the protocol a title.'); return; }
    if (mode === 'paste' && !content.trim()) { setErr('Paste the protocol text, or switch to file upload.'); return; }
    if (mode === 'upload' && !file) { setErr('Choose a file to upload.'); return; }
    setAdding(true);
    setErr('');
    try {
      if (mode === 'upload' && file) {
        await toolsApi.uploadProtocolFile(toolsKey, { dept, title: title.trim(), file });
      } else {
        await toolsApi.addProtocolText(toolsKey, { dept, title: title.trim(), content });
      }
      setTitle('');
      setContent('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch {
      setErr('Could not add that protocol — for a PDF, make sure it contains selectable text (not a scanned image).');
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    setProtocols(prev => prev.filter(p => p.id !== id));
    try {
      await toolsApi.deleteProtocol(toolsKey, id);
    } catch {
      await refresh();
    }
  }

  return (
    <div className="bg-surface border border-line shadow-sm rounded-2xl p-5 space-y-4">
      <div>
        <SectionHead>Hospital Protocols</SectionHead>
        <p className="text-xs text-ink-mute -mt-2">
          Upload this facility's own protocols for {DEPARTMENTS.find(d => d.id === dept)?.label}. Once added, the AI
          follows them over the generic guideline wherever they differ — cited by name on affected problems.
        </p>
      </div>

      {!loading && protocols.length > 0 && (
        <div className="space-y-1.5">
          {protocols.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 bg-surface-alt rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-ink truncate">{p.title}</p>
                <p className="text-[11px] text-ink-mute">
                  {p.sourceFilename ? `${p.sourceFilename} · ` : ''}{p.charCount.toLocaleString()} chars · added {new Date(p.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => remove(p.id)} className="text-ink-mute hover:text-red-500 text-lg shrink-0 px-1">×</button>
            </div>
          ))}
        </div>
      )}
      {!loading && protocols.length === 0 && (
        <p className="text-xs text-ink-mute">No protocols uploaded yet for this department.</p>
      )}

      <div className="border-t border-line pt-4 space-y-2.5">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Protocol title, e.g. Ward 12 Sepsis Pathway 2026"
            className="flex-1 bg-surface border border-line-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="flex bg-surface-alt rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setMode('paste')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === 'paste' ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute'}`}
            >
              Paste text
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === 'upload' ? 'bg-surface text-ink shadow-sm' : 'text-ink-mute'}`}
            >
              Upload file
            </button>
          </div>
        </div>

        {mode === 'paste' ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste the protocol text here…"
            rows={4}
            className="w-full bg-surface border border-line-strong rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
          />
        ) : (
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-ink-soft"
          />
        )}

        {err && <p className="text-xs text-red-500">{err}</p>}

        <button
          onClick={add}
          disabled={adding}
          className="bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {adding ? 'Adding…' : '+ Add protocol'}
        </button>
      </div>
    </div>
  );
}

// ─── LEGAL & STATUTORY FORMS ────────────────────────────────────────────────
// MHCA 72-hour assessment, J88, surgical consent: the AI drafts what the
// record already knows (prefilled, teal, editable), and is explicit about
// what it must NOT invent — amber sections the intern must complete, grey
// sections that require their own examination. Nothing here replaces the
// statutory paper form; the draft is transcription-ready source text.

// Strict clinical silos: each form only surfaces on wards where it is that
// ward's business. MHCA paperwork is psychiatry's instrument (initiated via
// emergency/medicine at district level); the J88 follows assault/injury into
// any ward; consent belongs to the procedural disciplines.
const LEGAL_FORMS: { type: LegalFormType; label: string; sub: string; icon: string; depts?: DeptId[] }[] = [
  { type: 'mhca-72hr', label: 'MHCA 72-hr assessment', sub: 'Mental Health Care Act form', icon: '🧠', depts: ['psych', 'emergency', 'medicine'] },
  { type: 'j88', label: 'J88', sub: 'Medico-legal injury report', icon: '⚖️' },
  { type: 'surgical-consent', label: 'Surgical consent', sub: 'Informed consent record', icon: '🖊️', depts: ['surgery', 'ortho', 'og', 'emergency', 'medicine', 'paeds', 'icu'] },
];

const SECTION_STYLE: Record<LegalFormSection['status'], { card: string; badge: string; badgeLabel: string }> = {
  prefilled: {
    card: 'border-brand-200 bg-surface',
    badge: 'bg-brand-50 text-brand-700',
    badgeLabel: 'Prefilled from record — verify & edit',
  },
  'requires-input': {
    card: 'border-amber-300 bg-amber-50/40',
    badge: 'bg-amber-100 text-amber-800',
    badgeLabel: 'YOU must complete',
  },
  'requires-examination': {
    card: 'border-line bg-surface-alt',
    badge: 'bg-surface-alt text-ink-soft',
    badgeLabel: 'Examine & record',
  },
};

function LegalFormsPanel({ patient, toolsKey, dept }: { patient: Patient; toolsKey: string; dept: DeptId }) {
  const [activeForm, setActiveForm] = useState<LegalFormType | null>(null);
  const [procedure, setProcedure] = useState('');
  const [loading, setLoading] = useState<LegalFormType | ''>('');
  const [err, setErr] = useState('');
  const [draft, setDraft] = useState<LegalFormDraft | null>(null);
  // Prefilled sections stay editable — edits live here, keyed by index.
  const [sectionText, setSectionText] = useState<Record<number, string>>({});

  async function generate(formType: LegalFormType) {
    if (formType === 'surgical-consent' && !procedure.trim()) return;
    setLoading(formType);
    setErr('');
    try {
      const res = await toolsApi.legalForm(toolsKey, {
        formType,
        dept,
        patientRecord: {
          intake: patient.intake,
          history: patient.history,
          assessment: patient.assessment,
          problems: patient.problems,
          imageFindings: patient.imageFindings,
          rounds: patient.rounds,
        },
        context: formType === 'surgical-consent' ? `Planned procedure: ${procedure.trim()}` : undefined,
      });
      setDraft(res);
      setSectionText(Object.fromEntries(res.sections.map((s, i) => [i, s.content])));
    } catch {
      setErr('Could not draft the form — check the record has the basics (name, age, presentation) and retry.');
    } finally {
      setLoading('');
    }
  }

  function copyAll() {
    if (!draft) return;
    const text = [
      draft.formTitle,
      '='.repeat(draft.formTitle.length),
      '',
      ...draft.sections.map((s, i) => `${s.heading.toUpperCase()}\n${sectionText[i] ?? s.content}`),
      '',
      draft.disclaimer,
    ].join('\n\n');
    copy(text);
  }

  function pick(formType: LegalFormType) {
    setDraft(null);
    setErr('');
    if (activeForm === formType) {
      setActiveForm(null);
      return;
    }
    setActiveForm(formType);
    // Consent needs the planned procedure first; the others generate directly.
    if (formType !== 'surgical-consent') void generate(formType);
  }

  return (
    <div className="bg-surface border border-line shadow-sm rounded-2xl p-5 space-y-4">
      <div>
        <SectionHead>Legal & Statutory</SectionHead>
        <p className="text-xs text-ink-mute -mt-2">
          Drafted from this patient's record. Teal sections are prefilled for checking; amber and grey sections the AI
          will not invent — they are yours.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-2">
        {LEGAL_FORMS.filter(f => !f.depts || f.depts.includes(dept)).map(f => (
          <button
            key={f.type}
            onClick={() => pick(f.type)}
            disabled={loading !== ''}
            className={`min-h-[64px] rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
              activeForm === f.type
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-surface border-line text-ink hover:border-brand-300 hover:bg-brand-50'
            }`}
          >
            <span className="block text-sm font-semibold">{f.icon} {f.label}</span>
            <span className={`block text-[11px] mt-0.5 ${activeForm === f.type ? 'text-brand-100' : 'text-ink-mute'}`}>
              {loading === f.type ? 'Drafting…' : f.sub}
            </span>
          </button>
        ))}
      </div>

      {activeForm === 'surgical-consent' && !draft && (
        <div className="flex gap-2">
          <input
            value={procedure}
            onChange={e => setProcedure(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void generate('surgical-consent'); }}
            placeholder="Planned procedure, e.g. laparoscopic appendicectomy"
            className="flex-1 bg-surface border border-line-strong rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-mute focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]"
          />
          <button
            onClick={() => void generate('surgical-consent')}
            disabled={!procedure.trim() || loading !== ''}
            className="bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-sm px-4 rounded-xl font-medium transition-colors min-h-[44px] shrink-0"
          >
            {loading === 'surgical-consent' ? 'Drafting…' : 'Draft consent'}
          </button>
        </div>
      )}

      {err && <p className="text-red-500 text-xs">{err}</p>}

      {draft && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-ink">{draft.formTitle}</p>
            <button
              onClick={copyAll}
              className="text-[13px] bg-surface-alt hover:bg-brand-50 text-brand-700 px-3.5 rounded-full font-medium transition-colors min-h-[44px]"
            >
              Copy all
            </button>
          </div>

          {draft.missingInfo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide mb-1">Missing from the record</p>
              <ul className="space-y-0.5">
                {draft.missingInfo.map((m, i) => (
                  <li key={i} className="text-[13px] text-amber-800 flex gap-2">
                    <span className="shrink-0">•</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {draft.sections.map((s, i) => {
            const style = SECTION_STYLE[s.status] ?? SECTION_STYLE.prefilled;
            return (
              <div key={i} className={`border rounded-xl p-3.5 space-y-2 ${style.card}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-[13px] font-semibold text-ink">{s.heading}</p>
                  <span className={`text-[10px] uppercase tracking-wide font-semibold rounded-full px-2 py-0.5 ${style.badge}`}>
                    {style.badgeLabel}
                  </span>
                </div>
                {s.status === 'prefilled' ? (
                  <textarea
                    value={sectionText[i] ?? s.content}
                    onChange={e => setSectionText(prev => ({ ...prev, [i]: e.target.value }))}
                    rows={Math.min(8, Math.max(2, (sectionText[i] ?? s.content).split('\n').length + 1))}
                    className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-[13px] text-ink leading-relaxed focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                  />
                ) : (
                  <p className="text-[13px] text-ink-soft leading-relaxed whitespace-pre-wrap">{s.content}</p>
                )}
              </div>
            );
          })}

          {draft.legalNotes.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide mb-1">Legal notes</p>
              <ul className="space-y-0.5">
                {draft.legalNotes.map((n, i) => (
                  <li key={i} className="text-[13px] text-slate-700 flex gap-2">
                    <span className="shrink-0">•</span>{n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-ink-mute leading-relaxed">{draft.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
