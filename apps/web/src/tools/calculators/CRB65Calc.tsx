import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function CRB65Calc() {
  const [c, setC] = useState(0);
  const [r, setR] = useState(0);
  const [b, setB] = useState(0);
  const [age, setAge] = useState(0);
  const score = c + r + b + age;
  const mort = score === 0 ? '<1%' : score === 1 ? '1-5%' : score === 2 ? '5-10%' : score === 3 ? '15-25%' : '>30%';
  return (
    <CalcCard title="CRB-65 (Pneumonia Severity)">
      {[
        ['Confusion (+1)', c, setC],
        ['RR ≥30 (+1)', r, setR],
        ['BP sys <90 or dia ≤60 (+1)', b, setB],
        ['Age ≥65 (+1)', age, setAge],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <input type="checkbox" checked={val === 1} onChange={e => (setter as (v: number) => void)(e.target.checked ? 1 : 0)} className="accent-brand-600 w-4 h-4" />
        </Row>
      ))}
      <Result label="CRB-65" value={`${score}/4 — 30-day mortality ~${mort}`} color={score === 0 ? 'green' : score <= 2 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
