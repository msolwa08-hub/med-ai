import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function GCSCalc() {
  const [e, setE] = useState<number | ''>(4);
  const [v, setV] = useState<number | ''>(5);
  const [m, setM] = useState<number | ''>(6);
  const total = (Number(e) || 0) + (Number(v) || 0) + (Number(m) || 0);
  const sev = total >= 13 ? 'Mild' : total >= 9 ? 'Moderate' : 'Severe';
  return (
    <CalcCard title="Glasgow Coma Scale">
      <Row label="Eyes (1-4)"><NumInput value={e} onChange={setE} min={1} max={4} /></Row>
      <Row label="Verbal (1-5)"><NumInput value={v} onChange={setV} min={1} max={5} /></Row>
      <Row label="Motor (1-6)"><NumInput value={m} onChange={setM} min={1} max={6} /></Row>
      <Result label="GCS" value={`${total}/15 — ${sev}`} color={total >= 13 ? 'green' : total >= 9 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
