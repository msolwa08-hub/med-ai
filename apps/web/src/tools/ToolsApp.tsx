import { AccessKeyGate } from '../components/AccessKeyGate';
import { toolsApi } from './toolsApi';
import { DEPARTMENTS, SUB_DEPARTMENTS } from './config/departments';
import { useToolsState, type Tab } from './state/useToolsState';
import { DeptSelector } from './components/DeptSelector';
import { SubDeptSelector, subDeptIcon } from './components/SubDeptSelector';
import { ClerkTab } from './tabs/ClerkTab';
import { ProblemsTab } from './tabs/ProblemsTab';
import { FeedbackButton } from './components/FeedbackButton';
import { ArrowLeft, Plus, X, GraduationCap } from 'lucide-react';
import { deptIcon } from './lib/icons';
import { ThemeToggle } from './components/ThemeToggle';
import { RoundTab } from './tabs/RoundTab';
import { FormulasTab } from './tabs/FormulasTab';
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

  // Results capture now lives inside the Bedside stream (the loop's second
  // input) — persisted activeTab 'results' from older sessions maps there.
  const currentTab: Tab = activeTab === 'results' ? 'clerk' : activeTab;
  const DeptIcon = deptIcon(dept);
  const SubDeptIcon = subDeptInfo ? subDeptIcon(subDeptInfo.id) : null;
  const tabs = ([
    { id: 'clerk' as Tab, label: 'Bedside' },
    { id: 'problems' as Tab, label: `Problems (${activePatient?.problems.length ?? 0})` },
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
            className="shrink-0 inline-flex items-center gap-1.5 max-w-[34vw] sm:max-w-none truncate text-sm font-medium text-ink-soft hover:text-ink bg-surface-alt px-2.5 py-1 rounded-lg transition-colors"
          >
            <DeptIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{deptInfo.label}</span>
          </button>
          {subDeptInfo && SubDeptIcon && (
            <button
              onClick={() => setSubDept(null)}
              title="Change ward/unit"
              className="min-w-0 shrink inline-flex items-center gap-1.5 max-w-[38vw] sm:max-w-none truncate text-sm font-medium text-brand-700 hover:text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              <SubDeptIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{subDeptInfo.label}</span>
            </button>
          )}
        </div>
        <div className="flex-1 min-w-0" />
        <ThemeToggle />
        {activePatient && (
          <button
            onClick={() => updatePatient(activePatient.id, { practice: !activePatient.practice })}
            title="Practice patient — kept out of anything real; for teaching/simulation"
            className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold h-9 px-2.5 rounded-lg border transition-colors ${
              activePatient.practice
                ? 'bg-warn/10 border-warn/30 text-warn'
                : 'bg-surface border-line-strong text-ink-mute hover:text-ink-soft'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activePatient.practice ? 'Practice on' : 'Practice'}</span>
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
        <div className="bg-warn/[0.08] border-b border-warn/20 text-warn text-xs font-medium text-center py-1.5 shrink-0">
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
                    className={`flex-1 text-left text-sm px-2.5 py-2 rounded-lg transition-colors truncate ${
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
                      className="shrink-0 grid place-items-center w-7 h-7 rounded-md text-ink-mute hover:text-band-exclude hover:bg-danger/10 transition-colors"
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
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  currentTab === t.id
                    ? 'text-brand-700 border-brand-500 bg-brand-50/60'
                    : 'text-ink-soft border-transparent hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — every tab is a single centred reading column
              (the Bedside cockpit is diagnosis-first: complaint → live picture → record). */}
          <div className="flex-1 overflow-y-auto px-5 py-8">
            {activePatient ? (
              <div className="max-w-3xl mx-auto">
                {currentTab === 'clerk' && (
                  <ClerkTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    subDept={subDept ?? undefined}
                    onPatient={patch => updatePatient(activePatient.id, patch)}
                  />
                )}
                {currentTab === 'problems' && (
                  <ProblemsTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    problems={activePatient.problems}
                    onChange={problems => updatePatient(activePatient.id, { problems })}
                  />
                )}
                {currentTab === 'round' && (
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
                {currentTab === 'formulas' && <FormulasTab dept={dept} patient={activePatient} />}
                {currentTab === 'documents' && (
                  <DocumentsTab key={activePatient.id} patient={activePatient} toolsKey={key} dept={dept} />
                )}
                {currentTab === 'specialist' && (
                  <SpecialistTab key={activePatient.id} patient={activePatient} toolsKey={key} dept={dept} />
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-ink-mute">
                <div className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-full bg-surface-alt">
                  <Plus className="w-6 h-6 text-ink-mute" />
                </div>
                <p className="text-ink-soft font-medium">No patient selected</p>
                <p className="text-sm text-ink-mute mt-1">Add a patient to start clerking.</p>
                <button
                  onClick={addPatient}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add patient
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
