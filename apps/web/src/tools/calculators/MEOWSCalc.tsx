import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function MEOWSCalc() {
  const [rr, setRr] = useState<number | ''>(18);
  const [spo2, setSpo2] = useState<number | ''>(98);
  const [sbp, setSbp] = useState<number | ''>(120);
  const [hr, setHr] = useState<number | ''>(80);
  const [temp, setTemp] = useState<number | ''>(37);
  const [avpu, setAvpu] = useState('A');

  let score = 0;
  const rrN = Number(rr); const spo2N = Number(spo2); const sbpN = Number(sbp);
  const hrN = Number(hr); const tempN = Number(temp);

  if (rrN < 10 || rrN > 29) score++;
  if (rrN < 5 || rrN > 35) score += 2;
  if (spo2N < 95) score++;
  if (spo2N < 92) score += 2;
  if (sbpN < 90 || sbpN > 160) score++;
  if (sbpN < 80) score += 2;
  if (hrN < 50 || hrN > 110) score++;
  if (hrN < 40 || hrN > 130) score += 2;
  if (tempN < 36 || tempN > 38) score++;
  if (avpu !== 'A') score++;
  if (avpu === 'U' || avpu === 'P') score++;

  const risk = score <= 2 ? 'Routine' : score <= 4 ? 'Increase observation' : score <= 6 ? 'Medical review' : 'Emergency';

  return (
    <CalcCard title="MEOWS (Modified Early Obstetric Warning Score)">
      <Row label="RR (/min)"><NumInput value={rr} onChange={setRr} /></Row>
      <Row label="SpO2 (%)"><NumInput value={spo2} onChange={setSpo2} /></Row>
      <Row label="SBP (mmHg)"><NumInput value={sbp} onChange={setSbp} /></Row>
      <Row label="HR (/min)"><NumInput value={hr} onChange={setHr} /></Row>
      <Row label="Temp (°C)"><NumInput value={temp} onChange={setTemp} /></Row>
      <Row label="AVPU">
        <select value={avpu} onChange={e => setAvpu(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900">
          <option value="A">Alert</option>
          <option value="V">Voice</option>
          <option value="P">Pain</option>
          <option value="U">Unresponsive</option>
        </select>
      </Row>
      <Result label="MEOWS" value={`${score} — ${risk}`} color={score <= 2 ? 'green' : score <= 4 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
