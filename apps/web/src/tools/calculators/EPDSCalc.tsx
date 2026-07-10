import { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { CalcCard, Row, Result } from './shared';

export function EPDSCalc() {
  const items = [
    'Able to laugh and see funny side of things',
    'Looked forward with enjoyment to things',
    'Blamed self unnecessarily when things go wrong',
    'Anxious or worried for no good reason',
    'Scared or panicky for no good reason',
    'Things getting on top of me',
    'Unhappy: difficulty sleeping',
    'Felt sad or miserable',
    'Unhappy that I have been crying',
    'Thought of harming myself',
  ];
  const [scores, setScores] = useState<number[]>(Array(10).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const risk = total >= 13 ? 'Likely depression — urgent review' : total >= 10 ? 'Possible depression — review needed' : 'Low risk';
  return (
    <CalcCard title="EPDS (Edinburgh Postnatal Depression Scale)">
      {items.map((item, i) => (
        <Row key={i} label={`${i + 1}. ${item}`}>
          <select value={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = Number(e.target.value); setScores(ns); }} className="bg-surface border border-line-strong rounded px-2 py-1 text-xs text-ink w-full">
            <option value={0}>0</option><option value={1}>1</option>
            <option value={2}>2</option><option value={3}>3</option>
          </select>
        </Row>
      ))}
      <Result label="EPDS" value={`${total}/30 — ${risk}`} color={total >= 13 ? 'red' : total >= 10 ? 'yellow' : 'green'} />
      {scores[9] > 0 && (
        <p className="flex items-center gap-1.5 text-danger text-xs mt-2 font-medium">
          <TriangleAlert className="w-3.5 h-3.5 shrink-0" aria-hidden /> Q10 positive — assess for self-harm risk immediately
        </p>
      )}
    </CalcCard>
  );
}
