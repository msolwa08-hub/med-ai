import { useState, useCallback, useEffect, useRef } from 'react';
import { storage } from '../../storage';
import { SUB_DEPARTMENTS, type DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { newPatient } from '../lib/patient';

export type Tab = 'intake' | 'history' | 'assessment' | 'problems' | 'results' | 'round' | 'formulas' | 'documents' | 'specialist';

// Top-level state machine for the Intern Tools app: tools-key gate → dept →
// (optional) subDept → patients → activePatient → activeTab, including all
// localStorage persistence. The persisted shape/keys are unchanged
// (medai_tools_key + medai_tools_state_v1 via ../storage), so previously
// saved state still loads.
export function useToolsState() {
  // Hydrate the whole working set from localStorage so a refresh, tab
  // discard, or phone-browser eviction never loses a round's worth of data.
  const persisted = useRef(storage.getToolsState()).current;
  const [key, setKey] = useState(storage.getToolsKey());
  const [dept, setDept] = useState<DeptId | null>(
    (persisted?.dept as DeptId | null) ?? null
  );
  const [subDept, setSubDept] = useState<string | null>(persisted?.subDept ?? null);
  const [patients, setPatients] = useState<Patient[]>(
    (persisted?.patients as Patient[] | undefined) ?? []
  );
  const [activePatientId, setActivePatientId] = useState<string | null>(
    persisted?.activePatientId ?? null
  );
  const [activeTab, setActiveTab] = useState<Tab>('intake');

  useEffect(() => {
    storage.setToolsState({ dept, subDept, patients, activePatientId });
  }, [dept, subDept, patients, activePatientId]);

  function handleKey(k: string) {
    storage.setToolsKey(k);
    setKey(k);
  }

  function ensurePatient(d: DeptId) {
    if (patients.length === 0) {
      const p = newPatient(d);
      setPatients([p]);
      setActivePatientId(p.id);
    } else if (!activePatientId) {
      setActivePatientId(patients[0].id);
    }
  }

  function selectDept(d: DeptId) {
    setDept(d);
    setSubDept(null);
    // Departments without sub-departments skip straight to the patient view.
    if (!SUB_DEPARTMENTS[d]) ensurePatient(d);
  }

  function selectSubDept(s: string) {
    setSubDept(s);
    if (dept) ensurePatient(dept);
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

  return {
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
  };
}
