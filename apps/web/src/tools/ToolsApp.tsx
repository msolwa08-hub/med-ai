import { useState } from 'react';
import { AccessKeyGate } from '../components/AccessKeyGate';
import { toolsApi } from './toolsApi';
import { DEPARTMENTS, SUB_DEPARTMENTS } from './config/departments';
import { useToolsState, type Tab } from './state/useToolsState';
import { DeptSelector } from './components/DeptSelector';
import { SubDeptSelector } from './components/SubDeptSelector';
import { ClerkTab } from './tabs/ClerkTab';
import { ProblemsTab } from './tabs/ProblemsTab';
import { FeedbackButton } from './components/FeedbackButton';
import { ArrowLeft, Plus, X, GraduationCap, Settings } from 'lucide-react';
import { deptIcon } from './lib/icons';
import { RoundTab } from './tabs/RoundTab';
import { FormulasTab } from './tabs/FormulasTab';
import { DocumentsTab } from './tabs/DocumentsTab';
import { SpecialistTab } from './tabs/SpecialistTab';
import { SlideOver } from './components/SlideOver';
import { SettingsPanel } from './components/SettingsPanel';
import { storage } from '../storage';

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

  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const currentTab: Tab = activeTab === 'results' ? 'clerk' : activeTab;
  const DeptIcon = deptIcon(dept);
  const tabs = ([
    { id: 'clerk' as Tab, label: 'Bedside' },
    { id: 'problems' as Tab, label: `Problems (${activePatient?.problems.length ?? 0})` },
    { id: 'round' as Tab, label: 'Round' },
    { id: 'specialist' as Tab, label: 'Specialist', show: dept === 'og' },
    { id: 'documents' as Tab, label: 'Documents' },
    { id: 'formulas' as Tab, label: 'Calculators' },
  ] as { id: Tab; label: string; show?: boolean }[]).filter(t => t.show !== false);

  const activePatientName = activePatient?.intake.name || 'Patient';

  return (
    <div className="min-h-screen bg-canvas flex flex-col overflow-x-hidden">
      {/* Header — clean, phone-first: back + dept icon + patient context + actions */}
      <header className="bg-surface/85 backdrop-blur-md border-b border-line px-3 sm:px-4 py-2.5 flex items-center gap-2 sm:gap-3 shrink-0 sticky top-0 z-20">
        <button
          onClick={onBack}
          aria-label="Back"
          className="shrink-0 grid place-items-center w-9 h-9 -ml-1 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>

        {/* Department identity — icon on phone, icon+name on desktop */}
        <button
          onClick={() => setSettingsOpen(true)}
          title={`${deptInfo.label} — tap to change`}
          className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink bg-surface-alt px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <DeptIcon className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline truncate">{deptInfo.label}</span>
        </button>

        {/* Active patient name — the load-bearing context */}
        {activePatient && (
          <span className="min-w-0 truncate text-sm font-medium text-ink">
            {activePatientName}
          </span>
        )}

        <div className="flex-1 min-w-0" />

        {/* Practice toggle — subtle, not duplicated with a banner */}
        {activePatient && (
          <button
            onClick={() => updatePatient(activePatient.id, { practice: !activePatient.practice })}
            title="Toggle practice mode"
            className={`shrink-0 grid place-items-center w-9 h-9 rounded-lg border transition-colors ${
              activePatient.practice
                ? 'bg-warn/10 border-warn/30 text-warn'
                : 'bg-surface border-line text-ink-mute hover:text-ink-soft'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="shrink-0 grid place-items-center w-9 h-9 rounded-lg text-ink-soft hover:text-ink hover:bg-surface-alt transition-colors"
        >
          <Settings className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={addPatient}
          className="shrink-0 text-sm font-medium bg-brand-700 hover:bg-brand-600 active:bg-brand-800 text-white pl-2.5 pr-3 h-9 rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Patient</span>
        </button>
      </header>

      {activePatient?.practice && (
        <div className="bg-warn/[0.08] border-b border-warn/20 text-warn text-xs font-medium text-center py-1.5 shrink-0">
          Practice patient — for teaching / simulation only
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — patient list (desktop only) */}
        {patients.length > 1 && (
          <aside className="hidden md:block w-48 border-r border-line overflow-y-auto shrink-0 bg-canvas scrollbar-thin">
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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Phone patient switcher */}
          {patients.length > 1 && (
            <div className="md:hidden flex gap-1.5 overflow-x-auto px-3 py-2 border-b border-line bg-canvas shrink-0 scrollbar-thin">
              {patients.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { setActivePatientId(p.id); setActiveTab('clerk'); }}
                  className={`shrink-0 max-w-[46vw] truncate text-xs font-medium px-3 py-1.5 rounded-pill border transition-colors ${
                    activePatientId === p.id
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-surface border-line text-ink-soft'
                  }`}
                >
                  {p.intake.name || `Patient ${i + 1}`}
                </button>
              ))}
            </div>
          )}

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

          {/* Tab content */}
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
                <p className="text-sm text-ink-mute mt-1">Add a patient to begin.</p>
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

      {/* Settings slide-over */}
      <SlideOver open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <SettingsPanel
          dept={dept}
          subDept={subDept}
          onDept={(d) => {
            selectDept(d);
            setSettingsOpen(false);
          }}
          onSubDept={(s) => {
            if (s) selectSubDept(s);
            setSettingsOpen(false);
          }}
          onClearData={() => {
            storage.clear();
            window.location.reload();
          }}
        />
      </SlideOver>
    </div>
  );
}
