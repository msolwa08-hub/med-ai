import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function WellsDVTCalc() {
  const criteria = [
    ['Active cancer (+1)', 1], ['Paralysis/cast (+1)', 1],
    ['Bedridden >3d / surgery <12wk (+1)', 1], ['Entire leg swelling (+1)', 1],
    ['Calf swelling >3cm (+1)', 1], ['Pitting oedema (+1)', 1],
    ['Collateral superficial veins (+1)', 1], ['Previous DVT (+1)', 1],
    ['Alternative diagnosis as likely (-2)', -2],
  ];
  const [scores, setScores] = useState<boolean[]>(Array(criteria.length).fill(false));
  const total = criteria.reduce<number>((s, [, v], i) => s + (scores[i] ? (v as number) : 0), 0);
  const risk = total >= 3 ? 'High' : total >= 1 ? 'Moderate' : 'Low';
  return (
    <CalcCard title="Wells' DVT Score">
      {criteria.map(([label], i) => (
        <Row key={i} label={label as string}>
          <input type="checkbox" checked={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = e.target.checked; setScores(ns); }} className="accent-brand-600 w-4 h-4" />
        </Row>
      ))}
      <Result label="Wells DVT" value={`${total} — ${risk} probability`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
