import { useState } from 'react';
import { CalcCard, Row, NumInput, Result } from './shared';

export function BMICalc() {
  const [wt, setWt] = useState<number | ''>(70);
  const [ht, setHt] = useState<number | ''>(170);
  const bmi = (Number(wt) && Number(ht)) ? Number(wt) / Math.pow(Number(ht) / 100, 2) : 0;
  const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  return (
    <CalcCard title="BMI">
      <Row label="Weight (kg)"><NumInput value={wt} onChange={setWt} /></Row>
      <Row label="Height (cm)"><NumInput value={ht} onChange={setHt} /></Row>
      {bmi > 0 && <Result label="BMI" value={`${bmi.toFixed(1)} — ${cat}`} color={bmi < 25 ? 'green' : bmi < 30 ? 'yellow' : 'red'} />}
    </CalcCard>
  );
}
