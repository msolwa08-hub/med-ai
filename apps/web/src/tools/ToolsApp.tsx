import { AccessKeyGate } from '../components/AccessKeyGate';
import { toolsApi } from './toolsApi';
import { DEPARTMENTS, SUB_DEPARTMENTS } from './config/departments';
import { useToolsState, type Tab } from './state/useToolsState';
import { DeptSelector } from './components/DeptSelector';
import { SubDeptSelector } from './components/SubDeptSelector';
import { IntakeTab } from './tabs/IntakeTab';
import { HistoryTab } from './tabs/HistoryTab';
import { AssessmentTab } from './tabs/AssessmentTab';
import { ProblemsTab } from './tabs/ProblemsTab';
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
        {subDeptInfo && (
          <button
            onClick={() => setSubDept(null)}
            className="text-sm text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded transition-colors"
            title="Change ward/unit"
          >
            {subDeptInfo.icon} {subDeptInfo.label}
          </button>
        )}
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
                    subDept={subDept ?? undefined}
                    onChange={patch => updatePatient(activePatient.id, { intake: { ...activePatient.intake, ...patch } })}
                  />
                )}
                {activeTab === 'history' && (
                  <HistoryTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    subDept={subDept ?? undefined}
                    onChange={patch => updatePatient(activePatient.id, { history: { ...activePatient.history, ...patch } })}
                    onPatient={patch => updatePatient(activePatient.id, patch)}
                  />
                )}
                {activeTab === 'assessment' && (
                  <AssessmentTab
                    key={activePatient.id}
                    patient={activePatient}
                    toolsKey={key}
                    dept={dept}
                    subDept={subDept ?? undefined}
                    onChange={patch => updatePatient(activePatient.id, { assessment: { ...activePatient.assessment, ...patch } })}
                    onAdmNote={note => updatePatient(activePatient.id, { admissionNote: note })}
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
                    onChange={patch => updatePatient(activePatient.id, { roundData: { ...activePatient.roundData, ...patch } })}
                    onLog={note => updatePatient(activePatient.id, {
                      progressLog: [
                        ...(activePatient.progressLog ?? []),
                        { date: new Date().toISOString().slice(0, 10), note },
                      ],
                    })}
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
    </div>
  );
}
