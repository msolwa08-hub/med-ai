import type { DeptFieldFragments, SplicedFields } from '../types';
import type { HistoryData } from '../types';

// Pre-theatre history questions shared by every surgical specialty —
// Orthopaedics reuses this same fragment. These are the discriminators the
// base history doesn't capture: the pain-evolution detail that localises an
// acute abdomen, anticoagulant/antiplatelet status (drives operative timing),
// NPO status, and anaesthetic risk. Inserted right after Past Medical History
// (base index 3) — same landing point as Medicine's fragment, because these
// gate the operative plan the way comorbidity control gates the medical one.
// Drawn from §1 (the four consultant questions) and §2.20 (indication-for-
// surgery & pre-op workup) of the Surgery dossier.
export const surgicalHistoryFields: SplicedFields<HistoryData> = {
  insertAt: 3,
  fields: d => [
    {
      key: 'painEvolution',
      label: 'Pain Evolution / Migration',
      value: d.painEvolution ?? '',
      kind: 'textarea',
      hint: 'SITE, MIGRATION and SEQUENCE localise more than any single sign — periumbilical→RIF (visceral→parietal peritoneum) is the classic appendicitis story; pain BEFORE vomiting suggests a surgical cause, vomiting/diarrhoea before pain suggests gastro/adenitis. Pain out of proportion to exam = mesenteric ischaemia until excluded. βhCG on every woman of reproductive age with abdominal pain — non-negotiable',
      placeholder: 'e.g. periumbilical pain 18h ago, migrated to RIF 6h ago, vomited once after pain started — worse on repeat exam',
    },
    {
      key: 'anticoagulants',
      label: 'Anticoagulants / Antiplatelets',
      value: d.anticoagulants ?? '',
      hint: 'name + exact LAST DOSE time — this sets operative and neuraxial-anaesthesia timing: DOACs timed to renal function, LMWH/warfarin bridged for a mechanical valve or recent VTE, aspirin/clopidogrel weighed against bleeding risk vs urgency of the operation. Never assume the drug chart is current — ask',
      placeholder: 'e.g. warfarin, last dose yesterday AM, INR 2.3 today; or none',
    },
    { key: 'lastMeal', label: 'Last Oral Intake', value: d.lastMeal ?? '', hint: 'record the TIME, not just what — elective threshold is 6h solids/2h clear fluids; in emergencies/trauma/obstruction assume a full stomach regardless of the clock (aspiration risk drives rapid-sequence induction)', placeholder: 'Time + content of last food/fluids' },
    { key: 'anaestheticHistory', label: 'Anaesthetic History', value: d.anaestheticHistory ?? '', hint: 'previous GA/spinal, complications, airway issues, family history of malignant hyperthermia or suxamethonium apnoea', placeholder: 'Previous GA/spinal, complications' },
  ],
};

export const surgeryFields: DeptFieldFragments = {
  intake: d => [
    { key: 'operationPerformed', label: 'Operation Performed', value: d.operationPerformed ?? '', hint: 'name the exact procedure and date — post-op complications run on a clock from the operation, not from admission, so the operative note is the reference point for every review', placeholder: 'e.g. laparoscopic appendicectomy, 08/07' },
    { key: 'postOpDay', label: 'Post-op Day', value: d.postOpDay ?? '', hint: 'drives what you are actively excluding today — day 0-2 wind (atelectasis), day 3-5 water/walking (UTI/DVT), day 5-7+ wound and the anastomotic leak: fever + tachycardia + rising CRP after day 4 + drain turned bilious/faeculent is a leak until proven otherwise. Tachycardia precedes peritonism — trust the pulse', placeholder: 'e.g. Day 3, or "not post-op"' },
  ],
  history: surgicalHistoryFields,
};
