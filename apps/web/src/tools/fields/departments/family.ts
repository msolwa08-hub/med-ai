import type { DeptFieldFragments } from '../types';

// Family Medicine / PHC field fragments — the district generalist's mental
// model: chronic disease CONTROL (not just presence), screening completeness,
// adherence barriers, and the stabilise-and-refer decision. SA PHC reality:
// HIV/TB colours every visit, the chronic disease register is the backbone,
// and the ICSM (Integrated Clinical Services Model) drives the workflow.
export const familyFields: DeptFieldFragments = {
  intake: d => [
    {
      key: 'visitType',
      label: 'Visit Type',
      value: d.visitType ?? '',
      placeholder: 'Acute / chronic follow-up / screening / antenatal booking',
    },
    {
      key: 'chronicRegister',
      label: 'Chronic Conditions',
      value: d.chronicRegister ?? '',
      hint: 'every active chronic diagnosis with its current regimen — the control question at every visit is whether the disease is at target, not whether it exists',
      placeholder: 'e.g. HPT on amlodipine 5mg + HCTZ 12.5mg; T2DM on metformin 1g bd; HIV on TLD',
    },
    {
      key: 'referralSource',
      label: 'Referral / Transfer',
      value: d.referralSource ?? '',
      placeholder: 'Self / down-referred from hospital / CHW referral',
    },
  ],

  history: {
    insertAt: 3,
    fields: d => [
      {
        key: 'adherence',
        label: 'Adherence & Barriers',
        value: d.adherence ?? '',
        kind: 'textarea',
        hint: 'the pharmacy refill gap is the single most reliable adherence marker — ask for the last collection date and count remaining tablets. Non-adherence is a symptom (cost, side-effects, stigma, denial, pill burden, distance), not a diagnosis',
        placeholder: 'e.g. last pharmacy visit 3 weeks ago, missed 5 days — transport cost',
      },
      {
        key: 'screeningStatus',
        label: 'Screening Status',
        value: d.screeningStatus ?? '',
        kind: 'textarea',
        hint: 'Pap smear (every 10yr from 30, or per HIV schedule), BMI, cardiovascular risk (>40yr), mental health (PHQ-2), TB symptom screen, cervical cancer, breast exam',
        placeholder: 'e.g. Pap 2024 normal, BMI 31, no CVD risk assessment done',
      },
      {
        key: 'socialDeterminants',
        label: 'Social Context',
        value: d.socialDeterminants ?? '',
        hint: 'food security, grant status (SASSA), employment, housing, substance use, GBV screen — these determine whether any management plan is feasible',
        placeholder: 'e.g. unemployed, CSG for 2 children, food-secure, no substance use',
      },
    ],
  },

  assessment: {
    insertAt: 4,
    fields: d => [
      {
        key: 'chronicControl',
        label: 'Chronic Disease Control Assessment',
        value: d.chronicControl ?? '',
        kind: 'textarea',
        hint: 'for each chronic condition: at target or not, and what changed. HPT: BP at target (<140/90, or <130/80 if DM/CKD). DM: HbA1c <7%, fasting glucose, foot exam, eye referral. HIV: VL suppressed (<50), CD4 if relevant, OI screening',
        placeholder: 'e.g. HPT: BP 152/94 — not at target, increase amlodipine; DM: HbA1c 8.2% — add gliclazide; HIV: VL <50 — suppressed, continue TLD',
      },
      {
        key: 'referralDecision',
        label: 'Referral / Escalation Decision',
        value: d.referralDecision ?? '',
        hint: 'the district generalist\'s core judgment: can I manage this at my level, or does this need specialist input? Document why and to whom',
        placeholder: 'e.g. refer ophthalmology for diabetic retinopathy screening; or manage at PHC — step up antihypertensives per STG',
      },
    ],
  },
};
