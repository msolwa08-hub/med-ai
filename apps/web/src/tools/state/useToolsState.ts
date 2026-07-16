import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { storage } from '../../storage';
import { SUB_DEPARTMENTS, type DeptId } from '../config/departments';
import type { Patient } from '../fields/types';
import { newPatient } from '../lib/patient';

export type Tab = 'clerk' | 'problems' | 'results' | 'round' | 'formulas' | 'documents' | 'specialist';

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
  const [activeTab, setActiveTab] = useState<Tab>('clerk');

  const persistTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      storage.setToolsState({ dept, subDept, patients, activePatientId });
    }, 400);
    return () => clearTimeout(persistTimer.current);
  }, [dept, subDept, patients, activePatientId]);

  const handleKey = useCallback((k: string) => {
    storage.setToolsKey(k);
    setKey(k);
  }, []);

  const deptRef = useRef(dept);
  deptRef.current = dept;

  const selectDept = useCallback((d: DeptId) => {
    setDept(d);
    setSubDept(null);
    if (!SUB_DEPARTMENTS[d]) {
      setPatients(prev => {
        if (prev.length === 0) {
          const p = newPatient(d);
          setActivePatientId(p.id);
          return [p];
        }
        setActivePatientId(cur => cur ?? prev[0].id);
        return prev;
      });
    }
  }, []);

  const selectSubDept = useCallback((s: string) => {
    setSubDept(s);
    const d = deptRef.current;
    if (d) {
      setPatients(prev => {
        if (prev.length === 0) {
          const p = newPatient(d);
          setActivePatientId(p.id);
          return [p];
        }
        setActivePatientId(cur => cur ?? prev[0].id);
        return prev;
      });
    }
  }, []);

  const addPatient = useCallback(() => {
    const d = deptRef.current;
    if (!d) return;
    const p = newPatient(d);
    setPatients(prev => [...prev, p]);
    setActivePatientId(p.id);
    setActiveTab('clerk');
  }, []);

  const removePatient = useCallback((id: string) => {
    setPatients(prev => {
      const next = prev.filter(p => p.id !== id);
      setActivePatientId(cur => cur === id ? (next[0]?.id ?? null) : cur);
      return next;
    });
  }, []);

  const updatePatient = useCallback((id: string, patch: Partial<Patient>) => {
    setPatients(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  return useMemo(() => ({
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
  }), [key, handleKey, dept, subDept, patients, activePatientId, activeTab, selectDept, selectSubDept, addPatient, removePatient, updatePatient]);
}
