import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function APGARCalc() {
  const [a, setA] = useState<number | ''>(2);
  const [p, setP] = useState<number | ''>(2);
  const [g, setG] = useState<number | ''>(2);
  const [ar, setAr] = useState<number | ''>(2);
  const [r, setR] = useState<number | ''>(2);
  const score = [a, p, g, ar, r].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const interp = score >= 7 ? 'Normal' : score >= 4 ? 'Requires intervention' : 'Resuscitation needed';
  return (
    <CalcCard title="APGAR Score">
      {[
        ['Appearance (0-2)', a, setA],
        ['Pulse (0-2)', p, setP],
        ['Grimace (0-2)', g, setG],
        ['Activity (0-2)', ar, setAr],
        ['Respiration (0-2)', r, setR],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={2} />
        </Row>
      ))}
      <Result label="APGAR" value={`${score}/10 — ${interp}`} color={score >= 7 ? 'green' : score >= 4 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
