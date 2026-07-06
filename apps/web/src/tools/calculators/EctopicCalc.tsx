import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function EctopicCalc() {
  const [hcg1, setHcg1] = useState<number | ''>('');
  const [hcg2, setHcg2] = useState<number | ''>('');
  const [prog, setProg] = useState<number | ''>('');
  const [days, setDays] = useState<number | ''>(48);

  const rise = (Number(hcg1) && Number(hcg2) && Number(days))
    ? (((Number(hcg2) - Number(hcg1)) / Number(hcg1)) * 100).toFixed(1)
    : null;

  const expectedRise = Number(days) >= 48 ? 53 : 66;
  const riseOk = rise ? Number(rise) >= expectedRise : null;

  const mtxEligible = Number(hcg1) < 5000 && Number(prog) < 20;

  return (
    <CalcCard title="Ectopic Pregnancy Assessment">
      <Row label="hCG #1 (IU/L)"><NumInput value={hcg1} onChange={setHcg1} placeholder="e.g. 500" /></Row>
      <Row label="hCG #2 (IU/L)"><NumInput value={hcg2} onChange={setHcg2} placeholder="e.g. 900" /></Row>
      <Row label="Interval (hours)"><NumInput value={days} onChange={setDays} placeholder="48" /></Row>
      {rise !== null && (
        <Result
          label="hCG rise"
          value={`${rise}% over ${days}h — ${riseOk ? 'Normal IUP pattern' : 'Abnormal (ectopic/miscarriage likely)'}`}
          color={riseOk ? 'green' : 'red'}
        />
      )}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Progesterone (nmol/L)"><NumInput value={prog} onChange={setProg} placeholder="e.g. 15" /></Row>
        {Number(hcg1) > 0 && Number(prog) > 0 && (
          <Result
            label="MTX Eligibility"
            value={mtxEligible ? 'Potentially eligible (hCG<5000 & Prog<20)' : 'Check criteria — not straightforward'}
            color={mtxEligible ? 'green' : 'yellow'}
          />
        )}
      </div>
    </CalcCard>
  );
}
