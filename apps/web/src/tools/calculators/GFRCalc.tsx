import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function GFRCalc() {
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
        <select value={sex} onChange={e => setSex(e.target.value as 'M' | 'F')} className="bg-surface border border-line-strong rounded px-2 py-1 text-sm text-ink">
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
      </Row>
      {gfr > 0 && <Result label="eGFR" value={`${gfr.toFixed(0)} mL/min/1.73m² — CKD ${stage}`} color={gfr >= 60 ? 'green' : gfr >= 30 ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}
