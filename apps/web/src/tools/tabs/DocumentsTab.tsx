import { useEffect, useRef, useState } from 'react';
import { toolsApi, type HospitalProtocolSummary } from '../toolsApi';
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
    <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
      <div>
        <SectionHead>Hospital Protocols</SectionHead>
        <p className="text-xs text-gray-500 -mt-2">
          Upload this facility's own protocols for {DEPARTMENTS.find(d => d.id === dept)?.label}. Once added, the AI
          follows them over the generic guideline wherever they differ — cited by name on affected problems.
        </p>
      </div>

      {!loading && protocols.length > 0 && (
        <div className="space-y-1.5">
          {protocols.map(p => (
            <div key={p.id} className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-800 truncate">{p.title}</p>
                <p className="text-[11px] text-gray-400">
                  {p.sourceFilename ? `${p.sourceFilename} · ` : ''}{p.charCount.toLocaleString()} chars · added {new Date(p.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => remove(p.id)} className="text-gray-400 hover:text-red-500 text-lg shrink-0 px-1">×</button>
            </div>
          ))}
        </div>
      )}
      {!loading && protocols.length === 0 && (
        <p className="text-xs text-gray-400">No protocols uploaded yet for this department.</p>
      )}

      <div className="border-t border-gray-100 pt-4 space-y-2.5">
        <div className="flex gap-2">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Protocol title, e.g. Ward 12 Sepsis Pathway 2026"
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setMode('paste')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === 'paste' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Paste text
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors ${mode === 'upload' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
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
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
          />
        ) : (
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-gray-600"
          />
        )}

        {err && <p className="text-xs text-red-500">{err}</p>}

        <button
          onClick={add}
          disabled={adding}
          className="bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {adding ? 'Adding…' : '+ Add protocol'}
        </button>
      </div>
    </div>
  );
}
