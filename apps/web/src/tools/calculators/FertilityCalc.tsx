import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function FertilityCalc() {
  const [midLutP, setMidLutP] = useState<number | ''>('');
  const [amh, setAmh] = useState<number | ''>('');
  const [day3Fsh, setDay3Fsh] = useState<number | ''>('');

  const ovConfirmed = Number(midLutP) >= 16;
  const ovarianReserve = Number(amh) < 5.4 ? 'Low' : Number(amh) > 25 ? 'High' : 'Normal';
  const fshNormal = Number(day3Fsh) < 10;

  return (
    <CalcCard title="Fertility Workup Interpretation">
      <Row label="Mid-luteal Progesterone (nmol/L)"><NumInput value={midLutP} onChange={setMidLutP} placeholder="e.g. 25" /></Row>
      {Number(midLutP) > 0 && (
        <Result label="Ovulation" value={ovConfirmed ? 'Confirmed (P ≥16)' : 'Uncertain (P <16 — anovulatory?)'} color={ovConfirmed ? 'green' : 'yellow'} />
      )}

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="AMH (pmol/L)"><NumInput value={amh} onChange={setAmh} placeholder="e.g. 14" /></Row>
        {Number(amh) > 0 && (
          <Result label="Ovarian Reserve (AMH)" value={ovarianReserve} color={ovarianReserve === 'Normal' ? 'green' : ovarianReserve === 'Low' ? 'red' : 'yellow'} />
        )}
      </div>

      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="Day 3 FSH (IU/L)"><NumInput value={day3Fsh} onChange={setDay3Fsh} placeholder="e.g. 7" /></Row>
        {Number(day3Fsh) > 0 && (
          <Result label="Day 3 FSH" value={fshNormal ? 'Normal (<10 IU/L)' : 'Elevated (≥10) — reduced reserve'} color={fshNormal ? 'green' : 'red'} />
        )}
      </div>
    </CalcCard>
  );
}
