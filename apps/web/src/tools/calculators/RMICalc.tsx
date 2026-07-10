import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function RMICalc() {
  const [us, setUs] = useState<number | ''>(0);
  const [meno, setMeno] = useState(0);
  const [ca125, setCa125] = useState<number | ''>(0);
  const m = meno === 0 ? 1 : 3;
  const rmi = Number(us) * m * Number(ca125);
  const risk = rmi < 200 ? 'Low' : rmi < 1000 ? 'Moderate' : 'High';
  return (
    <CalcCard title="RMI (Risk of Malignancy Index)">
      <p className="text-xs text-ink-mute mb-2">RMI = US score × M × CA-125</p>
      <Row label="US score (0/1/3)"><NumInput value={us} onChange={setUs} min={0} max={3} /></Row>
      <Row label="Postmenopausal">
        <input type="checkbox" checked={meno === 1} onChange={e => setMeno(e.target.checked ? 1 : 0)} className="accent-brand-600 w-4 h-4" />
      </Row>
      <Row label="CA-125 (U/mL)"><NumInput value={ca125} onChange={setCa125} /></Row>
      {rmi > 0 && <Result label="RMI" value={`${rmi.toFixed(0)} — ${risk} malignancy risk`} color={risk === 'Low' ? 'green' : risk === 'Moderate' ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}
