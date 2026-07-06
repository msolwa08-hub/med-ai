import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

// SA DoH Basic Antenatal Care Plus (BANC-Plus) contact schedule — the target
// gestational week for each of the 8 recommended antenatal contacts.
const BANC_PLUS_CONTACTS = [12, 20, 26, 30, 34, 36, 38, 40];

export function ANCScheduleCalc() {
  const [gaWeeks, setGaWeeks] = useState<number | ''>('');
  const [visits, setVisits] = useState<number | ''>('');
  const ga = Number(gaWeeks);
  const v = Number(visits);
  const assessed = gaWeeks !== '' && visits !== '';

  const expected = ga > 0 ? BANC_PLUS_CONTACTS.filter(w => w <= ga).length : 0;
  const behind = assessed && v < expected;
  const nextMilestone = BANC_PLUS_CONTACTS.find(w => w > ga);

  return (
    <CalcCard title="Antenatal Visit Schedule (BANC-Plus)">
      <Row label="Gestational Age (weeks)"><NumInput value={gaWeeks} onChange={setGaWeeks} placeholder="e.g. 28" /></Row>
      <Row label="Visits so far"><NumInput value={visits} onChange={setVisits} placeholder="e.g. 2" /></Row>
      {assessed && (
        <>
          <Result
            label="BANC-Plus"
            value={behind ? `Behind — expected ${expected}, has had ${v}` : `On track (${v}/${expected} expected by now)`}
            color={behind ? 'red' : 'green'}
          />
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            SA BANC-Plus targets 8 contacts: booking (ideally by 12 weeks), then {BANC_PLUS_CONTACTS.slice(1).join(', ')} weeks.
            {behind && ' Explore barriers to attendance (distance, cost, awareness) rather than just noting non-attendance — and use this visit to catch up risk-screening (BP, urine, Hb, syphilis/HIV re-test if indicated).'}
            {nextMilestone && !behind && ` Next scheduled contact around ${nextMilestone} weeks.`}
          </p>
        </>
      )}
    </CalcCard>
  );
}
