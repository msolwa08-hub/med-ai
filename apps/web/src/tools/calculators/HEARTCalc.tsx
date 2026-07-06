import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function HEARTCalc() {
  const [h, setH] = useState<number | ''>(0);
  const [e, setE] = useState<number | ''>(0);
  const [a, setA] = useState<number | ''>(0);
  const [r, setR] = useState<number | ''>(0);
  const [t, setT] = useState<number | ''>(0);
  const score = [h, e, a, r, t].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const risk = score <= 3 ? 'Low' : score <= 6 ? 'Moderate' : 'High';
  return (
    <CalcCard title="HEART Score (Chest Pain)">
      <p className="text-xs text-gray-400 mb-2">Each component scored 0-2</p>
      {[
        ['History (0-2)', h, setH],
        ['ECG (0-2)', e, setE],
        ['Age (0-2)', a, setA],
        ['Risk Factors (0-2)', r, setR],
        ['Troponin (0-2)', t, setT],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={2} />
        </Row>
      ))}
      <Result label="HEART" value={`${score}/10 — ${risk} risk`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
