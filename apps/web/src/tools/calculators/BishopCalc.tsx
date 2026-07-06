import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function BishopCalc() {
  const [dil, setDil] = useState<number | ''>(0);
  const [eff, setEff] = useState<number | ''>(0);
  const [sta, setSta] = useState<number | ''>(0);
  const [con, setCon] = useState<number | ''>(0);
  const [pos, setPos] = useState<number | ''>(0);
  const score = [dil, eff, sta, con, pos].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const favour = score >= 8 ? 'Favourable (induction likely successful)' : score >= 6 ? 'Borderline' : 'Unfavourable (consider cervical ripening)';
  return (
    <CalcCard title="Bishop Score (Cervical Assessment)">
      {[
        ['Dilatation 0-3cm (0-3)', dil, setDil, 3],
        ['Effacement 0-80% (0-3)', eff, setEff, 3],
        ['Station -3 to +2 (0-3)', sta, setSta, 3],
        ['Consistency (0-2)', con, setCon, 2],
        ['Position (0-2)', pos, setPos, 2],
      ].map(([label, val, setter, mx]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={mx as number} />
        </Row>
      ))}
      <Result label="Bishop Score" value={`${score}/13 — ${favour}`} color={score >= 8 ? 'green' : score >= 6 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
