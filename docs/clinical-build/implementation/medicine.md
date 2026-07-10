# Internal Medicine — implementation record (M2)

Dossier → app registries, 2026-07-10. **Clinical content below is pending your
review** — flag anything to change and it's a one-line edit per item.

## Loop gate (live, first run)
100/100 — ACS on troponin+ECG (75→92), DKA on VBG+ketones (90→98), PTB on
GeneXpert (75→95), decompensated HF on NT-proBNP (80→92). ~7.8c/loop.
Reports: `../eval/m2/`.

## 1. Clerking fields (`fields/departments/medicine.ts`)
Inserted after PMH: **Chronic Disease Control** (the control, not the label —
last HbA1c/BP/creatinine, complications, adherence), **TB Symptom Screen**
(4-symptom WHO screen, any positive → GeneXpert; prior TB + outcome),
**Functional Status / Exercise Tolerance** (baseline vs now). HIV status was
already a base field.

## 2. Smart blocks (`config/smartBlocks.ts`) — scoped medicine+emergency
- **dm-control** — type, treatment (metformin/+SU/insulin/…), last HbA1c,
  adherence + why missed, hypo frequency graded to "needed help/admission",
  complication screen (retino/nephro/neuro/foot). Why-lines: T1DM omission →
  DKA; elderly T2DM → HHS; sulfonylurea hypos recur → admit.
- **hiv-art-status** — on ART, regimen (TLD/TEE/2nd-line PI), interruptions,
  last VL + date, last CD4 + date, cotrimoxazole, TB history/TPT. Why-lines:
  CD4 <200 = advanced HIV disease → reflex CrAg (≤100), urine LAM if unwell;
  the four AHD killers (TB, crypto, severe bacterial, PJP).
- **tb-workup** — 4-symptom screen, GeneXpert sent/result (incl. RIF-resistant
  pathway), urine LAM with its SA indication, CXR, prior TB
  (none/completed/defaulted/MDR contact). TB is notifiable.
- **heart-failure-profile** — NYHA, EF/echo date, daily weights charted, fluid
  restriction, diuretic adherence, precipitant (ischaemia/infection/
  non-adherence/arrhythmia/anaemia). Why-line: a decompensation without a named
  precipitant recurs.
- ⚠️ For your call: the older unscoped `hiv-art` block (O&G-flavoured) can
  co-surface with the new one on medicine wards — say the word and I scope the
  old one to O&G.

## 3. Treatment sets (`config/treatmentSets.ts`) — triggers on problem list
Every line carries drug/dose/route/frequency + a consultant why. Please check
doses against your STG copy:
- **DKA — first hour + ongoing**: saline 15-20ml/kg 1st hour; insulin
  0.1u/kg/h ONLY after K+ ≥3.3; K+ replacement by band (<3.3 hold insulin /
  3.3-5.0 add 20-30mmol/L / >5.0 none); hourly glucose, 2-hourly VBG+ketones;
  dextrose 5-10% when glucose <14 (insulin continues); precipitant hunt;
  never stop infusion until ketones <0.6 + pH >7.3 + eating, s/c overlap 1-2h.
- **ACS initial bundle**: aspirin 300mg chewed → 75mg od; clopidogrel 300mg
  load (75mg no-load if >75y); enoxaparin 1mg/kg bd (od if eGFR <30);
  atorvastatin 80mg nocte day 1; serial ECG + 3-6h troponin delta; STEMI →
  senior + thrombolysis eligibility screen (tenecteplase/streptokinase, no
  on-site PCI reality); nitrate+morphine only if SBP >90, avoid nitrate in RV
  infarct/sildenafil.
- **Acute pulmonary oedema**: sit up + O2 to 94-98% (88-92% retainer);
  furosemide 40-80mg IV (double usual oral); ISDN 5mg SL if SBP >110; strict
  balance + daily weights; catheter for hourly output; precipitant screen;
  CPAP early if failing.
- **Hyperkalaemia**: ECG + monitor first (treat the ECG, not the number);
  calcium gluconate 10% 10ml if ECG changes (protects, doesn't lower);
  insulin 10u + 50ml 50% dextrose (hourly glucose ×4-6h after); salbutamol
  nebs 10-20mg; stop ACEi/ARB/spironolactone/NSAIDs/trimethoprim + treat
  cause + exclude haemolysed sample; repeat K+ 1-2h; dialysis if refractory/
  anuric.
- **CAP (adult)**: CURB-65 decides disposition (0-1 out / 2 admit / 3-5 ICU
  discussion); cultures before antibiotics (don't delay >45min); ward tier
  amoxicillin 1g po 8h (co-amoxiclav 1.2g IV 8h if comorbid) + azithromycin
  500mg od ×3; severe tier ceftriaxone 1g IV od + azithromycin; O2 to target;
  HIV test + TB screen on EVERY SA pneumonia; 48-72h formal review.

## 4. Investigations (`lib/investigations.ts`) — new panels + rules
- **Cardiac markers** (medicine/emergency/ICU): hs-Trop (ref <14), CK,
  NT-proBNP. Rules: rising >20% on serials + raised → RED "acute myocardial
  injury — ACS pathway until alternative established"; single raised value →
  AMBER "repeat 3-6h, the DELTA makes the diagnosis".
- **HIV/TB workup** (same depts): CD4 (RED <200 → AHD package: reflex CrAg,
  urine LAM if unwell, cotrimoxazole), viral load (AMBER >1000 → enhanced
  adherence + repeat per SA pathway; persistent → resistance/switch).
- Existing delta rules already matched the dossier (K+ ≥6, Na >8/24h,
  creatinine KDIGO ×1.5 or +26, Hb −2g/dL) — untouched.

## 5. AI discipline lens (`tools-assist.ts`)
Medicine had NO department guidance (the only major dept without one). Added:
syndrome-first reasoning, chronic disease characterised by CONTROL, functional
baseline as the yardstick, HIV status + TB symptom screen on every SA medical
admission, trends-against-baseline interpretation.

## Remaining for Medicine (next increments)
Symptom cascades review against dossier §2 (13 cascades exist, coverage looks
good — a gap pass, not a rewrite); "normals" reference layer (§3); acid-base/
RTA + hyponatraemia structured workups as calculators (§4.1-4.3); six-agent
depth eval once content settles.
