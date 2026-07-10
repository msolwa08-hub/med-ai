import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function QSOFACalc() {
  const [rr, setRr] = useState(0);
  const [ms, setMs] = useState(0);
  const [sbp, setSbp] = useState(0);
  const score = rr + ms + sbp;
  return (
    <CalcCard title="qSOFA Score">
      {[
        ['RR ≥22/min', rr, setRr],
        ['Altered mental status (GCS < 15)', ms, setMs],
        ['SBP ≤100 mmHg', sbp, setSbp],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <input type="checkbox" checked={val === 1} onChange={e => (setter as (v: number) => void)(e.target.checked ? 1 : 0)} className="accent-brand-600 w-4 h-4" />
        </Row>
      ))}
      <Result label="qSOFA" value={`${score}/3 — ${score >= 2 ? 'HIGH risk (consider sepsis workup)' : 'Low risk'}`} color={score >= 2 ? 'red' : 'green'} />
    </CalcCard>
  );
}
