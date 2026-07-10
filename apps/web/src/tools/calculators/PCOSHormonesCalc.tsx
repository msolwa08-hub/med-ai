import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function PCOSHormonesCalc() {
  const [lh, setLh] = useState<number | ''>('');
  const [fsh, setFsh] = useState<number | ''>('');
  const [testo, setTesto] = useState<number | ''>('');
  const [shbg, setShbg] = useState<number | ''>('');
  const [insulin, setInsulin] = useState<number | ''>('');
  const [glucose, setGlucose] = useState<number | ''>('');

  const ratio = (Number(lh) && Number(fsh)) ? (Number(lh) / Number(fsh)).toFixed(2) : null;
  const fai = (Number(testo) && Number(shbg)) ? ((Number(testo) / Number(shbg)) * 100).toFixed(1) : null;
  const homa = (Number(insulin) && Number(glucose)) ? ((Number(insulin) * Number(glucose)) / 22.5).toFixed(2) : null;

  return (
    <CalcCard title="PCOS Hormonal Panel">
      <Row label="LH (IU/L)"><NumInput value={lh} onChange={setLh} placeholder="e.g. 10" /></Row>
      <Row label="FSH (IU/L)"><NumInput value={fsh} onChange={setFsh} placeholder="e.g. 5" /></Row>
      {ratio && <Result label="LH:FSH Ratio" value={`${ratio} ${Number(ratio) > 2 ? '(Elevated — PCOS pattern)' : '(Normal)'}`} color={Number(ratio) > 2 ? 'yellow' : 'green'} />}

      <div className="mt-3 border-t border-line pt-3">
        <Row label="Total Testosterone (nmol/L)"><NumInput value={testo} onChange={setTesto} /></Row>
        <Row label="SHBG (nmol/L)"><NumInput value={shbg} onChange={setShbg} /></Row>
        {fai && <Result label="FAI (Free Androgen Index)" value={`${fai}% ${Number(fai) > 4.5 ? '(Elevated)' : '(Normal)'}`} color={Number(fai) > 4.5 ? 'yellow' : 'green'} />}
      </div>

      <div className="mt-3 border-t border-line pt-3">
        <Row label="Fasting Insulin (pmol/L)"><NumInput value={insulin} onChange={setInsulin} /></Row>
        <Row label="Fasting Glucose (mmol/L)"><NumInput value={glucose} onChange={setGlucose} /></Row>
        {homa && <Result label="HOMA-IR" value={`${homa} ${Number(homa) > 2.5 ? '(Insulin Resistance)' : '(Normal)'}`} color={Number(homa) > 2.5 ? 'yellow' : 'green'} />}
      </div>
    </CalcCard>
  );
}
