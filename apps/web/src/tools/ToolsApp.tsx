import { AccessKeyGate } from '../components/AccessKeyGate';
import { toolsApi } from './toolsApi';
import { DEPARTMENTS, SUB_DEPARTMENTS } from './config/departments';
import { useToolsState, type Tab } from './state/useToolsState';
import { DeptSelector } from './components/DeptSelector';
import { SubDeptSelector } from './components/SubDeptSelector';
import { ClerkTab } from './tabs/ClerkTab';
import { ProblemsTab } from './tabs/ProblemsTab';
import { FeedbackButton } from './components/FeedbackButton';
import { ArrowLeft, Plus, X, GraduationCap } from 'lucide-react';
import { RoundTab } from './tabs/RoundTab';
import { FormulasTab } from './tabs/FormulasTab';
import { ResultsTab } from './tabs/ResultsTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { SpecialistTab } from './tabs/SpecialistTab';

// ─── MAIN TOOLS APP ──────────────────────────────────────────────────────────

export function ToolsApp({ onBack }: { onBack: () => void }) {
  const {
    key,
    handleKey,
    dept,
    setDept,
    subDept,
    setSubDept,
    patients,
    activePatientId,
    setActivePatientId,
    activeTab,
    setActiveTab,
    selectDept,
    selectSubDept,
    addPatient,
    removePatient,
    updatePatient,
  } = useToolsState();

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

  const subDeptOptions = SUB_DEPARTMENTS[dept];
  if (subDeptOptions && !subDept) {
    return (
      <SubDeptSelector
        dept={dept}
        options={subDeptOptions}
        onSelect={selectSubDept}
        onBack={() => setDept(null)}
      />
    );
  }

  const activePatient = patients.find(p => p.id === activePatientId);
  const deptInfo = DEPARTMENTS.find(d => d.id === dept)!;
  const subDeptInfo = subDept ? subDeptOptions?.find(s => s.id === subDept) : undefined;

  const tabs = ([
    { id: 'clerk' as Tab, label: 'Clerk' },
    { id: 'problems' as Tab, label: `Problems (${activePatient?.problems.length ?? 0})` },
    { id: 'results' as Tab, label: 'Results' },
    { id: 'formulas' as Tab, label: 'Calculators' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'specialist' as Tab, label: 'Specialist', show: dept === 'og' },
    { id: 'round' as Tab, label: 'Round & Handover' },
  ] as { id: Tab; label: string; show?: boolean }[]).filter(t => t.show !== false);

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-x-hidden">
      {/* Header — a fixed identity cluster on the left that can shrink and
          truncate, and a fixed action on the right that never clips. */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-line px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 shrink-0 sticky top-0 z-20">
        <button
          onClick={onBack}
          aria-label="Back to departments"
          className="shrink-0 grid place-items-center w-9 h-9 -ml-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <img src="/medai-icon.svg" alt="" className="w-7 h-7 shrink-0" />
        {/* Wordmark: carried by the icon on phone, spelled out from sm up */}
        <span className="hidden sm:inline text-ink font-semibold shrink-0 tracking-tight">Intern Tools</span>
        <span className="hidden sm:inline text-line-strong shrink-0">·</span>
        {/* Context chips: the load-bearing orientation. Allowed to shrink and
            truncate before anything clips the page. */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => setDept(null)}
            title="Change department"
            className="shrink-0 max-w-[34vw] sm:max-w-none truncate text-[13px] font-medium text-ink-soft hover:text-ink bg-surface-alt px-2.5 py-1 rounded-lg transition-colors"
          >
            {deptInfo.icon} {deptInfo.label}
          </button>
          {subDeptInfo && (
            <button
              onClick={() => setSubDept(null)}
              title="Change ward/unit"
              className="min-w-0 shrink max-w-[38vw] sm:max-w-none truncate text-[13px] font-medium text-brand-700 hover:text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              {subDeptInfo.icon} {subDeptInfo.label}
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0" />
        {activePatient && (
          <button
            onClick={() => updatePatient(activePatient.id, { practice: !activePatient.practice })}
            title="Practice patient — kept out of anything real; for teaching/simulation"
            className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold h-9 px-2.5 rounded-lg border transition-colors ${
              activePatient.practice
                ? 'bg-amber-100 border-amber-300 text-amber-800'
                : 'bg-surface border-line-strong text-ink-mute hover:text-ink-soft'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activePatient.practice ? 'Practice' : 'Practice'}</span>
          </button>
        )}
        <button
          onClick={addPatient}
          className="shrink-0 text-sm font-medium bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-white pl-2.5 pr-3 h-9 rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span>Patient</span>
        </button>
      </header>

      {activePatient?.practice && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-medium text-center py-1.5 shrink-0">
          Practice patient — for teaching / simulation. Not a record of care.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — patient list */}
        {patients.length > 1 && (
          <aside className="w-48 border-r border-line overflow-y-auto shrink-0 bg-canvas scrollbar-thin">
            <div className="p-2 space-y-1">
              {patients.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1">
                  <button
                    onClick={() => { setActivePatientId(p.id); setActiveTab('clerk'); }}
                    className={`flex-1 text-left text-[13px] px-2.5 py-2 rounded-lg transition-colors truncate ${
                      activePatientId === p.id
                        ? 'bg-brand-600 text-white font-medium shadow-card'
                        : 'text-ink-soft hover:bg-surface'
                    }`}
                  >
                    {p.intake.name || `Patient ${i + 1}`}
                  </button>
                  {patients.length > 1 && (
                    <button
                      onClick={() => removePatient(p.id)}
                      aria-label="Remove patient"
                      className="shrink-0 grid place-items-center w-7 h-7 rounded-md text-ink-mute hover:text-band-exclude hover:bg-rose-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
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
          <div className="bg-surface/85 backdrop-blur-md border-b border-line flex overflow-x-auto shrink-0 scrollbar-thin">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === t.id
                    ? 'text-brand-700 border-brand-500 bg-brand-50/60'
                    : 'text-ink-soft border-transparent hover:text-ink'
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
                {activeTab === 'clerk' && (
                  <ClerkTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    subDept={subDept ?? undefined}
                    onPatient={patch => updatePatient(activePatient.id, patch)}
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
                    subDept={subDept ?? undefined}
                    onLog={note => updatePatient(activePatient.id, {
                      progressLog: [
                        ...(activePatient.progressLog ?? []),
                        { date: new Date().toISOString().slice(0, 10), note },
                      ],
                    })}
                    onPatient={patch => updatePatient(activePatient.id, patch)}
                  />
                )}
                {activeTab === 'results' && (
                  <ResultsTab
                    key={activePatient.id}
                    dept={dept}
                    subDept={subDept ?? undefined}
                    toolsKey={key}
                    patient={activePatient}
                    onPatient={patch => updatePatient(activePatient.id, patch)}
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

      <FeedbackButton toolsKey={key} screen={activeTab} dept={dept} subDept={subDept ?? undefined} />
    </div>
  );
}
