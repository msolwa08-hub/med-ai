import { useState } from 'react';
import { CalcCard, Row, Result } from './shared';

export function PHQ9Calc() {
  const items = ['Little interest/pleasure', 'Feeling down/hopeless', 'Sleep problems', 'Tired/little energy', 'Poor appetite/overeating', 'Feeling bad about yourself', 'Concentration difficulties', 'Moving/speaking slowly or restless', 'Thoughts of self-harm'];
  const [scores, setScores] = useState<number[]>(Array(9).fill(0));
  const total = scores.reduce((s, v) => s + v, 0);
  const sev = total <= 4 ? 'Minimal' : total <= 9 ? 'Mild' : total <= 14 ? 'Moderate' : total <= 19 ? 'Moderately Severe' : 'Severe';
  return (
    <CalcCard title="PHQ-9 Depression Screen">
      {items.map((item, i) => (
        <Row key={i} label={`${i + 1}. ${item}`}>
          <select value={scores[i]} onChange={e => { const ns = [...scores]; ns[i] = Number(e.target.value); setScores(ns); }} className="bg-surface border border-line-strong rounded px-2 py-1 text-xs text-ink">
            <option value={0}>0 - Not at all</option>
            <option value={1}>1 - Several days</option>
            <option value={2}>2 - More than half</option>
            <option value={3}>3 - Nearly every day</option>
          </select>
        </Row>
      ))}
      <Result label="PHQ-9" value={`${total}/27 — ${sev} depression`} color={total <= 4 ? 'green' : total <= 9 ? 'yellow' : 'red'} />
    </CalcCard>
  );
}
