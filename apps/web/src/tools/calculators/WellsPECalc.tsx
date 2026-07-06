import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function WellsPECalc() {
  const criteria = [
    ['Clinical signs/symptoms of DVT (+3)', 3],
    ['PE is #1 diagnosis, or equally likely (+3)', 3],
    ['HR > 100 (+1.5)', 1.5],
    ['Immobilisation ≥3 days / surgery in 4wk (+1.5)', 1.5],
    ['Previous DVT/PE (+1.5)', 1.5],
    ['Haemoptysis (+1)', 1],
    ['Malignancy (+1)', 1],
  ];
  const [scores, setScores] = useState<boolean[]>(Array(criteria.length).fill(false));
  const total = criteria.reduce<number>((s, [, v], i) => s + (scores[i] ? (v as number) : 0), 0);
  const risk = total > 6 ? 'High' : total > 2 ? 'Moderate' : 'Low';
  return (
    <CalcCard title="Wells' PE Score">
      {criteria.map(([label], i) => (
        <Row key={i} label={label as string}>
          <input type="checkbox" checked={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = e.target.checked; setScores(ns); }} className="accent-blue-500 w-4 h-4" />
        </Row>
      ))}
      <Result label="Wells PE" value={`${total} — ${risk} probability`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
