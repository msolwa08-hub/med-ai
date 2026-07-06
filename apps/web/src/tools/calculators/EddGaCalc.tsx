import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function EddGaCalc() {
  const [lmp, setLmp] = useState('');
  const [usDays, setUsDays] = useState<number | ''>('');
  const today = new Date();

  let gaByLmp = '';
  let eddByLmp = '';
  if (lmp) {
    const lmpDate = new Date(lmp);
    const daysDiff = Math.floor((today.getTime() - lmpDate.getTime()) / 86400000);
    const weeks = Math.floor(daysDiff / 7);
    const days = daysDiff % 7;
    gaByLmp = `${weeks}+${days} weeks`;
    const edd = new Date(lmpDate.getTime() + 280 * 86400000);
    eddByLmp = edd.toLocaleDateString();
  }

  return (
    <CalcCard title="EDD / Gestational Age">
      <Row label="LMP Date">
        <input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="bg-white border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 w-full" />
      </Row>
      {gaByLmp && <Result label="GA by LMP" value={gaByLmp} color="pink" />}
      {eddByLmp && <Result label="EDD by LMP (Naegele)" value={eddByLmp} color="pink" />}
      <div className="mt-3 border-t border-gray-200 pt-3">
        <Row label="US GA (days)"><NumInput value={usDays} onChange={setUsDays} placeholder="e.g. 200" /></Row>
        {usDays !== '' && Number(usDays) > 0 && (
          <Result label="GA from US" value={`${Math.floor(Number(usDays) / 7)}+${Number(usDays) % 7} weeks`} color="pink" />
        )}
      </div>
    </CalcCard>
  );
}
