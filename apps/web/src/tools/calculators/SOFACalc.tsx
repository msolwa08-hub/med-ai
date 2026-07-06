import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function SOFACalc() {
  const [resp, setResp] = useState<number | ''>(0);
  const [coag, setCoag] = useState<number | ''>(0);
  const [liver, setLiver] = useState<number | ''>(0);
  const [cardio, setCardio] = useState<number | ''>(0);
  const [cns, setCns] = useState<number | ''>(0);
  const [renal, setRenal] = useState<number | ''>(0);
  const total = [resp, coag, liver, cardio, cns, renal].reduce<number>((s, v) => s + (Number(v) || 0), 0);
  const mort = total <= 1 ? '<10%' : total <= 5 ? '15-20%' : total <= 9 ? '40%' : total <= 11 ? '50-60%' : '>80%';
  return (
    <CalcCard title="SOFA Score (Sequential Organ Failure Assessment)">
      {[
        ['Respiratory (0-4)', resp, setResp],
        ['Coagulation (0-4)', coag, setCoag],
        ['Liver (0-4)', liver, setLiver],
        ['Cardiovascular (0-4)', cardio, setCardio],
        ['CNS/GCS (0-4)', cns, setCns],
        ['Renal (0-4)', renal, setRenal],
      ].map(([label, val, setter]) => (
        <Row key={label as string} label={label as string}>
          <NumInput value={val as number | ''} onChange={setter as (v: number | '') => void} min={0} max={4} />
        </Row>
      ))}
      <Result label="SOFA" value={`${total}/24 — Mortality ~${mort}`} color={total >= 10 ? 'red' : total >= 5 ? 'yellow' : 'green'} />
    </CalcCard>
  );
}
