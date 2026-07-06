import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function AKICalc() {
  const [baseline, setBaseline] = useState<number | ''>('');
  const [current, setCurrent] = useState<number | ''>('');
  const [urine, setUrine] = useState<number | ''>('');
  const [hours, setHours] = useState<number | ''>('');
  const b = Number(baseline);
  const c = Number(current);
  const u = Number(urine);
  const h = Number(hours);

  // KDIGO staging: creatinine criterion and urine-output criterion — take the worse.
  let crStage = 0;
  if (b > 0 && c > 0) {
    const ratio = c / b;
    if (ratio >= 3 || c >= 353.6) crStage = 3;
    else if (ratio >= 2) crStage = 2;
    else if (ratio >= 1.5 || c - b >= 26.5) crStage = 1;
  }
  let uoStage = 0;
  if (u > 0 && h > 0) {
    if (u < 0.3 && h >= 24) uoStage = 3;
    else if (u < 0.5 && h >= 12) uoStage = 2;
    else if (u < 0.5 && h >= 6) uoStage = 1;
  }
  const stage = Math.max(crStage, uoStage);
  const assessed = (b > 0 && c > 0) || (u > 0 && h > 0);
  const advice =
    stage === 0
      ? 'No AKI by KDIGO criteria on these values'
      : `KDIGO Stage ${stage} AKI — hold nephrotoxics (NSAIDs, ACE-i/ARB, aminoglycosides, contrast), review drug doses for renal clearance, strict fluid balance${stage >= 2 ? ', urgent senior review' : ''}${stage === 3 ? ', consider dialysis referral criteria' : ''}`;

  return (
    <CalcCard title="AKI Staging (KDIGO)">
      <Row label="Baseline creatinine (µmol/L)"><NumInput value={baseline} onChange={setBaseline} placeholder="e.g. 80" /></Row>
      <Row label="Current creatinine (µmol/L)"><NumInput value={current} onChange={setCurrent} placeholder="e.g. 160" /></Row>
      <Row label="Urine output (mL/kg/h)"><NumInput value={urine} onChange={setUrine} placeholder="optional" /></Row>
      <Row label="Over how many hours"><NumInput value={hours} onChange={setHours} placeholder="optional" /></Row>
      {assessed && (
        <Result
          label="KDIGO"
          value={stage === 0 ? 'No AKI' : `Stage ${stage} AKI`}
          color={stage === 0 ? 'green' : stage === 1 ? 'yellow' : 'red'}
        />
      )}
      {assessed && <p className="text-xs text-gray-500 leading-relaxed mt-2">{advice}</p>}
    </CalcCard>
  );
}
