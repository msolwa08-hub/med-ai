import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function PCOSCalc() {
  const [oligo, setOligo] = useState(false);
  const [hyper, setHyper] = useState(false);
  const [pcosMorph, setPcosMorph] = useState(false);
  const criteria = [oligo, hyper, pcosMorph].filter(Boolean).length;
  const diagnosis = criteria >= 2 ? 'PCOS likely (Rotterdam ≥2/3)' : 'PCOS unlikely (< 2/3 criteria)';
  return (
    <CalcCard title="PCOS — Rotterdam Criteria">
      <Row label="Oligomenorrhoea / anovulation">
        <input type="checkbox" checked={oligo} onChange={e => setOligo(e.target.checked)} className="accent-brand-600 w-4 h-4" />
      </Row>
      <Row label="Clinical/biochemical hyperandrogenism">
        <input type="checkbox" checked={hyper} onChange={e => setHyper(e.target.checked)} className="accent-brand-600 w-4 h-4" />
      </Row>
      <Row label="Polycystic ovaries on USS">
        <input type="checkbox" checked={pcosMorph} onChange={e => setPcosMorph(e.target.checked)} className="accent-brand-600 w-4 h-4" />
      </Row>
      <Result label="Rotterdam" value={`${criteria}/3 — ${diagnosis}`} color={criteria >= 2 ? 'yellow' : 'green'} />
    </CalcCard>
  );
}
