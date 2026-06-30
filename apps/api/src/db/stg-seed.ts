/**
 * STG (Standard Treatment Guidelines) seeder
 * Seeds 20 high-prevalence South African conditions into ICD10Code + STGEntry tables
 * Based on SA DoH STGs 8th Edition 2023 and Essential Medicines List
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONDITIONS: Array<{
  code: string;
  description: string;
  icdCategory: string;
  condition: {
    conditionName: string;
    synonyms: string[];
    category: string;
    subCategory?: string;
    levelOfCare: string;
    firstLineTreatment: object[];
    alternativeTreatment?: object[];
    investigations: object[];
    referralCriteria?: string;
    redFlags?: string;
    followUpAdvice?: string;
    notes?: string;
    saPrevalence: string;
  };
}> = [
  // ── Respiratory ──────────────────────────────────────
  {
    code: 'J18.9',
    description: 'Pneumonia, unspecified organism',
    icdCategory: 'Respiratory',
    condition: {
      conditionName: 'Pneumonia',
      synonyms: ['chest infection', 'lung infection', 'pneumonitis'],
      category: 'Respiratory',
      subCategory: 'Lower Respiratory Tract Infection',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Amoxicillin', dose: '500mg', route: 'Oral', frequency: '8 hourly', duration: '5 days', notes: 'First line for community-acquired pneumonia' },
        { medication: 'Paracetamol', dose: '1g', route: 'Oral', frequency: '6 hourly PRN', duration: '5 days', notes: 'For fever and pain' },
      ],
      alternativeTreatment: [
        { medication: 'Doxycycline', dose: '100mg', route: 'Oral', frequency: '12 hourly', duration: '5 days', indication: 'Penicillin allergy or atypical pneumonia suspected' },
        { medication: 'Azithromycin', dose: '500mg', route: 'Oral', frequency: 'Once daily', duration: '5 days', indication: 'Atypical organisms (Mycoplasma, Chlamydia)' },
      ],
      investigations: [
        { name: 'Chest X-ray', urgency: 'URGENT', rationale: 'Confirm diagnosis and extent of consolidation' },
        { name: 'Full blood count', urgency: 'ROUTINE', rationale: 'Assess infection severity' },
        { name: 'CRP / Procalcitonin', urgency: 'ROUTINE', rationale: 'Differentiate bacterial from viral aetiology' },
        { name: 'Sputum M/C/S', urgency: 'ROUTINE', rationale: 'Identify organism and sensitivities in severe cases' },
        { name: 'HIV rapid test', urgency: 'ROUTINE', rationale: 'Screen for immunocompromise (mandatory in SA)' },
        { name: 'Oxygen saturation (SpO2)', urgency: 'STAT', rationale: 'Assess respiratory compromise' },
      ],
      referralCriteria: 'SpO2 < 92%, RR > 30/min, HR > 125/min, confusion, multilobar disease, failed outpatient therapy',
      redFlags: 'Cyanosis, SpO2 < 90%, HR > 120, RR > 30, confusion, hypotension',
      followUpAdvice: 'Review in 48–72 hours. Repeat CXR at 6 weeks to confirm resolution.',
      notes: 'In HIV-positive patients consider PCP — give co-trimoxazole if CD4 < 200. TB must be excluded.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    icdCategory: 'Respiratory',
    condition: {
      conditionName: 'Acute Upper Respiratory Tract Infection (URTI)',
      synonyms: ['common cold', 'viral URTI', 'nasopharyngitis'],
      category: 'Respiratory',
      subCategory: 'Upper Respiratory Tract Infection',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Paracetamol', dose: '1g', route: 'Oral', frequency: '6 hourly PRN', duration: '3–5 days', notes: 'Symptomatic relief of fever and pain' },
        { medication: 'Saline nasal spray', dose: '2 sprays each nostril', route: 'Intranasal', frequency: '4–6 hourly', duration: 'As needed', notes: 'Nasal congestion relief' },
      ],
      investigations: [
        { name: 'None routinely required', urgency: 'ROUTINE', rationale: 'Viral aetiology; antibiotics not indicated' },
        { name: 'Throat swab for GAS', urgency: 'ROUTINE', rationale: 'If features of Group A Strep (Centor score ≥ 3)' },
      ],
      referralCriteria: 'Features of bacterial sinusitis, peritonsillar abscess, epiglottitis, or severe dysphagia',
      redFlags: 'Stridor, drooling, inability to swallow, neck stiffness, purpuric rash',
      followUpAdvice: 'Return if no improvement in 5–7 days or symptoms worsen.',
      notes: 'Antibiotics NOT indicated for viral URTI. Educate patient on antibiotic stewardship.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'J45.9',
    description: 'Asthma, unspecified',
    icdCategory: 'Respiratory',
    condition: {
      conditionName: 'Asthma',
      synonyms: ['bronchospasm', 'reversible airways disease', 'RAD'],
      category: 'Respiratory',
      subCategory: 'Chronic Airway Disease',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Salbutamol MDI', dose: '100 mcg/puff, 2 puffs', route: 'Inhaled', frequency: 'PRN (max 8 puffs/day)', duration: 'Ongoing', notes: 'Short-acting beta-2 agonist reliever' },
        { medication: 'Beclomethasone MDI', dose: '100–200 mcg/puff, 2 puffs', route: 'Inhaled', frequency: 'Twice daily', duration: 'Ongoing', notes: 'Inhaled corticosteroid controller (persistent asthma)' },
      ],
      alternativeTreatment: [
        { medication: 'Prednisolone', dose: '40mg', route: 'Oral', frequency: 'Once daily', duration: '5 days', indication: 'Acute exacerbation' },
        { medication: 'Budesonide/Formoterol MDI', dose: '160/4.5 mcg, 1–2 puffs', route: 'Inhaled', frequency: 'Twice daily', duration: 'Ongoing', indication: 'Step 3 therapy — inadequate control on ICS alone' },
      ],
      investigations: [
        { name: 'Peak flow measurement', urgency: 'ROUTINE', rationale: 'Assess severity and response to bronchodilator' },
        { name: 'Spirometry with reversibility', urgency: 'ROUTINE', rationale: 'Confirm diagnosis — FEV1/FVC < 0.7 with ≥12% reversibility' },
        { name: 'Chest X-ray', urgency: 'ROUTINE', rationale: 'Exclude alternative diagnosis' },
        { name: 'Allergy testing', urgency: 'ROUTINE', rationale: 'Identify triggers in allergic asthma' },
      ],
      referralCriteria: 'Severe exacerbation (SpO2 < 92%, PEFR < 50% predicted), uncontrolled asthma on step 3 therapy',
      redFlags: 'Silent chest, SpO2 < 92%, unable to complete sentences, cyanosis',
      followUpAdvice: 'Review 4–6 weekly until controlled. Annual review. Check inhaler technique at each visit.',
      notes: 'All patients should have an Asthma Action Plan. TB must be excluded in SA if diagnosis uncertain.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'J44.1',
    description: 'Chronic obstructive pulmonary disease with acute exacerbation',
    icdCategory: 'Respiratory',
    condition: {
      conditionName: 'COPD Exacerbation',
      synonyms: ['acute exacerbation of COPD', 'AECOPD'],
      category: 'Respiratory',
      subCategory: 'Chronic Airway Disease',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Salbutamol nebulisation', dose: '2.5mg', route: 'Nebulised', frequency: 'Every 4–6 hours', duration: 'Until stable', notes: 'Short-acting bronchodilator' },
        { medication: 'Ipratropium nebulisation', dose: '0.5mg', route: 'Nebulised', frequency: 'Every 6 hours', duration: 'Until stable', notes: 'Combine with salbutamol' },
        { medication: 'Prednisolone', dose: '40mg', route: 'Oral', frequency: 'Once daily', duration: '5 days', notes: 'Systemic corticosteroids shorten exacerbation' },
        { medication: 'Amoxicillin-Clavulanate', dose: '875/125mg', route: 'Oral', frequency: '12 hourly', duration: '5 days', notes: 'If increased sputum purulence (Anthonisen criteria II/III)' },
      ],
      investigations: [
        { name: 'SpO2 / Arterial blood gas', urgency: 'STAT', rationale: 'Assess oxygenation — target SpO2 88–92% in COPD' },
        { name: 'Chest X-ray', urgency: 'URGENT', rationale: 'Exclude pneumonia, pneumothorax, pulmonary oedema' },
        { name: 'FBC, CRP', urgency: 'URGENT', rationale: 'Assess for secondary bacterial infection' },
        { name: 'ECG', urgency: 'ROUTINE', rationale: 'Exclude cor pulmonale, arrhythmia' },
      ],
      referralCriteria: 'Severe dyspnoea at rest, SpO2 < 88% despite oxygen, altered consciousness, haemodynamic compromise',
      redFlags: 'Cyanosis, inability to speak in sentences, SpO2 < 88%, altered consciousness',
      followUpAdvice: 'Review in 4–6 weeks post-exacerbation. Pulmonary rehabilitation referral. Smoking cessation counselling.',
      notes: 'Avoid high-flow oxygen (risk of hypercapnic drive suppression). Target SpO2 88–92%.',
      saPrevalence: 'Common',
    },
  },
  // ── Infectious Disease ────────────────────────────────────
  {
    code: 'A15.0',
    description: 'Tuberculosis of lung, confirmed by sputum microscopy',
    icdCategory: 'Infectious Disease',
    condition: {
      conditionName: 'Pulmonary Tuberculosis (TB)',
      synonyms: ['TB', 'phthisis', "Koch's disease"],
      category: 'Infectious Disease',
      subCategory: 'Mycobacterial Infection',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'RHZE (Rifampicin/Isoniazid/Pyrazinamide/Ethambutol)', dose: 'Weight-based per SA TB guidelines', route: 'Oral', frequency: 'Daily (DOT preferred)', duration: '2 months intensive phase', notes: 'Intensive phase (2RHZE)' },
        { medication: 'RH (Rifampicin/Isoniazid)', dose: 'Weight-based', route: 'Oral', frequency: 'Daily', duration: '4 months continuation phase', notes: 'Continuation phase (4RH)' },
        { medication: 'Pyridoxine (Vitamin B6)', dose: '25mg', route: 'Oral', frequency: 'Daily', duration: '6 months', notes: 'Prevent isoniazid-induced peripheral neuropathy' },
      ],
      investigations: [
        { name: 'GeneXpert MTB/RIF (sputum)', urgency: 'URGENT', rationale: 'Gold standard — rapid diagnosis and rifampicin resistance detection' },
        { name: 'Sputum smear microscopy (3 samples)', urgency: 'URGENT', rationale: 'AFB smear for initial screening and monitoring' },
        { name: 'Chest X-ray', urgency: 'URGENT', rationale: 'Assess extent and pattern of disease' },
        { name: 'HIV rapid test + CD4 + viral load', urgency: 'URGENT', rationale: 'Mandatory co-testing (TB/HIV co-infection very common in SA)' },
        { name: 'Liver function tests (LFTs)', urgency: 'ROUTINE', rationale: 'Baseline before hepatotoxic drugs; monitor monthly' },
        { name: 'Urea and creatinine', urgency: 'ROUTINE', rationale: 'Baseline renal function for ethambutol dosing' },
        { name: 'Visual acuity', urgency: 'ROUTINE', rationale: 'Baseline before ethambutol (optic neuritis risk)' },
      ],
      referralCriteria: 'Drug-resistant TB (MDR/XDR), meningeal/miliary/pericardial TB, haemoptysis, treatment failure',
      redFlags: 'Massive haemoptysis, neurological signs, haemodynamic instability, weight loss > 10%',
      followUpAdvice: 'Monthly sputum smear during intensive phase. Review adherence at each visit. Notify district TB coordinator.',
      notes: 'TB is a notifiable condition in SA. All contacts must be screened. Rifampicin interactions with ARVs require careful scheduling.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'B20',
    description: 'Human immunodeficiency virus [HIV] disease',
    icdCategory: 'Infectious Disease',
    condition: {
      conditionName: 'HIV/AIDS',
      synonyms: ['HIV', 'AIDS', 'retroviremia'],
      category: 'Infectious Disease',
      subCategory: 'Viral Infection',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'TLD (Tenofovir/Lamivudine/Dolutegravir)', dose: '1 tablet', route: 'Oral', frequency: 'Once daily', duration: 'Lifelong', notes: 'SA first-line regimen — start same day as diagnosis (test and treat)' },
      ],
      alternativeTreatment: [
        { medication: 'TLE (Tenofovir/Lamivudine/Efavirenz)', dose: '1 tablet', route: 'Oral', frequency: 'Once daily', duration: 'Lifelong', indication: 'TLD not tolerated or not recommended in first trimester' },
      ],
      investigations: [
        { name: 'HIV rapid test / ELISA', urgency: 'URGENT', rationale: 'Confirm diagnosis' },
        { name: 'CD4 count', urgency: 'URGENT', rationale: 'Baseline immune function; guide prophylaxis thresholds' },
        { name: 'HIV viral load', urgency: 'URGENT', rationale: 'Baseline and monitoring of treatment response' },
        { name: 'FBC, LFTs, U&E, glucose', urgency: 'ROUTINE', rationale: 'Baseline bloods before starting ART' },
        { name: 'Hepatitis B surface antigen', urgency: 'ROUTINE', rationale: 'Co-infection screening (affects ART choice)' },
        { name: 'Syphilis serology (RPR/TPPA)', urgency: 'ROUTINE', rationale: 'STI co-infection screening' },
        { name: 'TB screening (symptoms + GeneXpert)', urgency: 'URGENT', rationale: 'TB/HIV co-infection must be excluded before ART start' },
      ],
      referralCriteria: 'CD4 < 50 (expedited ART), TB/HIV co-infection, cryptococcal meningitis, toxoplasmosis, Kaposi sarcoma',
      redFlags: 'Severe immunosuppression (CD4 < 50), neurological symptoms, severe weight loss, opportunistic infections',
      followUpAdvice: 'Viral load at 6 months, then annually. CD4 annually until > 500. Adherence counselling at every visit.',
      notes: 'FAST-track ART: initiate same day as HIV diagnosis per SA guidelines. Co-trimoxazole prophylaxis if CD4 < 200.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'B54',
    description: 'Unspecified malaria',
    icdCategory: 'Infectious Disease',
    condition: {
      conditionName: 'Malaria',
      synonyms: ['plasmodium infection', 'tropical fever'],
      category: 'Infectious Disease',
      subCategory: 'Parasitic Infection',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Artemether-Lumefantrine (Coartem)', dose: '4 tablets (80mg/480mg)', route: 'Oral', frequency: 'Twice daily for 3 days', duration: '3 days', notes: 'For uncomplicated P. falciparum — give with fat-containing food' },
      ],
      alternativeTreatment: [
        { medication: 'Chloroquine', dose: '600mg then 300mg at 6, 24, 48 hours', route: 'Oral', frequency: 'As per schedule', duration: '3 days', indication: 'P. vivax, P. ovale, P. malariae (not P. falciparum)' },
      ],
      investigations: [
        { name: 'Malaria rapid diagnostic test (RDT)', urgency: 'STAT', rationale: 'Rapid bedside diagnosis in endemic areas' },
        { name: 'Thick and thin blood films', urgency: 'STAT', rationale: 'Species identification and parasite density' },
        { name: 'FBC, LFTs, U&E, glucose, creatinine', urgency: 'URGENT', rationale: 'Assess for severe malaria complications' },
        { name: 'Blood culture', urgency: 'URGENT', rationale: 'Exclude concurrent bacterial sepsis' },
      ],
      referralCriteria: 'Severe malaria (parasitaemia > 5%, altered consciousness, seizures, jaundice, renal failure, Hb < 7g/dL)',
      redFlags: 'Impaired consciousness, seizures, severe anaemia, jaundice, haemoglobinuria, respiratory distress, hypoglycaemia',
      followUpAdvice: 'Repeat blood film at 48–72 hours to confirm parasite clearance.',
      notes: 'Malaria is endemic in Limpopo, Mpumalanga, and northern KZN. Notifiable disease. IV Artesunate for severe malaria.',
      saPrevalence: 'Common',
    },
  },
  // ── Cardiovascular ─────────────────────────────────────
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    icdCategory: 'Cardiovascular',
    condition: {
      conditionName: 'Hypertension',
      synonyms: ['high blood pressure', 'HTN', 'arterial hypertension'],
      category: 'Cardiovascular',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Amlodipine', dose: '5mg', route: 'Oral', frequency: 'Once daily', duration: 'Ongoing', notes: 'First-line CCB; titrate to 10mg if BP > 140/90 at 4 weeks' },
        { medication: 'Enalapril', dose: '5mg', route: 'Oral', frequency: 'Twice daily', duration: 'Ongoing', notes: 'ACE inhibitor; preferred in diabetic patients (renoprotective)' },
      ],
      alternativeTreatment: [
        { medication: 'Hydrochlorothiazide', dose: '12.5–25mg', route: 'Oral', frequency: 'Once daily', duration: 'Ongoing', indication: 'Add as second agent or in high-sodium patients' },
        { medication: 'Atenolol', dose: '50mg', route: 'Oral', frequency: 'Once daily', duration: 'Ongoing', indication: 'Co-existing angina, tachycardia, or post-MI' },
      ],
      investigations: [
        { name: 'Blood pressure (3 readings)', urgency: 'ROUTINE', rationale: 'Confirm diagnosis (average ≥ 140/90 mmHg)' },
        { name: 'Urea, creatinine, eGFR', urgency: 'ROUTINE', rationale: 'Assess renal function as target organ damage' },
        { name: 'Urine dipstick (protein)', urgency: 'ROUTINE', rationale: 'Screen for hypertensive nephropathy' },
        { name: 'Fasting glucose / HbA1c', urgency: 'ROUTINE', rationale: 'Screen for concurrent diabetes' },
        { name: 'Fasting lipogram', urgency: 'ROUTINE', rationale: 'Calculate cardiovascular risk (Framingham/WHO Risk Score)' },
        { name: 'ECG', urgency: 'ROUTINE', rationale: 'Detect LVH, arrhythmia, ischaemia' },
      ],
      referralCriteria: 'Resistant hypertension (BP > 160/100 on 3 agents), suspected secondary hypertension, hypertensive emergencies, target organ damage',
      redFlags: 'BP > 180/110 with symptoms (hypertensive emergency), severe headache, visual changes, chest pain, acute kidney injury',
      followUpAdvice: 'Review monthly until BP controlled, then 3-monthly. Annual cardiovascular risk assessment.',
      notes: 'Lifestyle modification is foundational: salt restriction (< 5g/day), weight reduction, exercise, smoking cessation, alcohol moderation.',
      saPrevalence: 'Common',
    },
  },
  // ── Endocrine ───────────────────────────────────────────
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    icdCategory: 'Endocrine',
    condition: {
      conditionName: 'Type 2 Diabetes Mellitus',
      synonyms: ['T2DM', 'diabetes', 'non-insulin dependent diabetes', 'NIDDM'],
      category: 'Endocrine',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Metformin', dose: '500mg (titrate to 1000mg)', route: 'Oral', frequency: 'Twice daily with meals', duration: 'Ongoing', notes: 'First-line; titrate slowly to minimise GI side effects; avoid if eGFR < 30' },
      ],
      alternativeTreatment: [
        { medication: 'Glibenclamide', dose: '2.5–5mg', route: 'Oral', frequency: 'Once daily before breakfast', duration: 'Ongoing', indication: 'Inadequate glycaemic control on metformin alone; monitor for hypoglycaemia' },
        { medication: 'Insulin (Glargine / NPH)', dose: 'Individualised', route: 'Subcutaneous', frequency: 'Once or twice daily', duration: 'Ongoing', indication: 'HbA1c > 10% despite oral agents, or symptomatic hyperglycaemia' },
      ],
      investigations: [
        { name: 'Fasting plasma glucose', urgency: 'ROUTINE', rationale: 'Diagnosis (≥ 7.0 mmol/L) and monitoring' },
        { name: 'HbA1c', urgency: 'ROUTINE', rationale: '3-monthly monitoring; target < 7% (53 mmol/mol)' },
        { name: 'Urea, creatinine, eGFR', urgency: 'ROUTINE', rationale: 'Screen for diabetic nephropathy (annually)' },
        { name: 'Urine albumin:creatinine ratio (ACR)', urgency: 'ROUTINE', rationale: 'Early nephropathy detection (annually)' },
        { name: 'Fasting lipogram', urgency: 'ROUTINE', rationale: 'Cardiovascular risk assessment' },
        { name: 'Foot examination', urgency: 'ROUTINE', rationale: 'Neuropathy, peripheral vascular disease screening (annually)' },
      ],
      referralCriteria: 'HbA1c > 10% uncontrolled, diabetic ketoacidosis, hyperosmolar state, severe complications (nephropathy, retinopathy, neuropathy)',
      redFlags: 'DKA symptoms (polyuria, polydipsia, vomiting, fruity breath, Kussmaul breathing), severe hypoglycaemia',
      followUpAdvice: 'HbA1c 3-monthly, annual review of all diabetic complications, foot inspection at every visit.',
      notes: 'Comprehensive approach: glycaemic control + BP + lipids + smoking cessation. SGLT2 inhibitors and GLP-1 agonists available at specialist level.',
      saPrevalence: 'Common',
    },
  },
  // ── Neurological ──────────────────────────────────────
  {
    code: 'G40.9',
    description: 'Epilepsy, unspecified',
    icdCategory: 'Neurological',
    condition: {
      conditionName: 'Epilepsy',
      synonyms: ['seizure disorder', 'convulsions'],
      category: 'Neurological',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Carbamazepine', dose: '100mg BD, titrate to 200–400mg BD', route: 'Oral', frequency: 'Twice daily', duration: 'Ongoing (minimum 2 years seizure-free before considering cessation)', notes: 'Focal seizures; monitor LFTs and FBC; teratogenic' },
        { medication: 'Sodium Valproate', dose: '200mg BD, titrate to 400–800mg BD', route: 'Oral', frequency: 'Twice daily', duration: 'Ongoing', notes: 'Generalised seizures; avoid in women of childbearing potential (teratogen)' },
      ],
      alternativeTreatment: [
        { medication: 'Phenobarbitone', dose: '30–60mg BD', route: 'Oral', frequency: 'Twice daily', duration: 'Ongoing', indication: 'Cost-effective option at primary care level; sedating' },
        { medication: 'Lamotrigine', dose: '25mg OD, titrate slowly', route: 'Oral', frequency: 'Once or twice daily', duration: 'Ongoing', indication: 'Preferred if sodium valproate contraindicated; requires slow titration' },
      ],
      investigations: [
        { name: 'EEG', urgency: 'ROUTINE', rationale: 'Classification of epilepsy syndrome' },
        { name: 'MRI brain', urgency: 'ROUTINE', rationale: 'Identify structural cause (tumour, hippocampal sclerosis, cortical dysplasia)' },
        { name: 'FBC, LFTs, U&E, glucose', urgency: 'ROUTINE', rationale: 'Baseline and monitoring' },
        { name: 'HIV serology', urgency: 'ROUTINE', rationale: 'HIV-associated CNS disease as new seizure cause' },
        { name: 'Urine pregnancy test (women)', urgency: 'ROUTINE', rationale: 'Critical before starting teratogenic agents' },
      ],
      referralCriteria: 'Status epilepticus, first seizure (needs neurological assessment), uncontrolled seizures on 2 agents, focal onset with structural lesion',
      redFlags: 'Status epilepticus (seizure > 5 min or repeated without recovery), post-ictal focal deficit, head trauma, fever with seizures',
      followUpAdvice: 'Review 3-monthly until seizure-free for 2 years, then 6-monthly. Do not drive until 6 months seizure-free (SA law).',
      notes: 'Counsel patients not to drive, swim alone, or operate heavy machinery. Contraception counselling mandatory for women on antiepileptics.',
      saPrevalence: 'Common',
    },
  },
  // ── Gastrointestinal ──────────────────────────────────
  {
    code: 'A09',
    description: 'Other and unspecified gastroenteritis and colitis of infectious and unspecified origin',
    icdCategory: 'Gastrointestinal',
    condition: {
      conditionName: 'Acute Gastroenteritis',
      synonyms: ['stomach bug', 'gastro', 'vomiting and diarrhoea', 'food poisoning'],
      category: 'Gastrointestinal',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Oral Rehydration Solution (ORS)', dose: '200–400mL after each loose stool', route: 'Oral', frequency: 'After each stool', duration: 'Until resolved', notes: 'Sachet in 1L water — cornerstone of treatment' },
        { medication: 'Zinc sulphate', dose: '20mg (children < 6 months: 10mg)', route: 'Oral', frequency: 'Once daily', duration: '10–14 days', notes: 'Recommended by WHO for children' },
      ],
      alternativeTreatment: [
        { medication: 'Metronidazole', dose: '400mg', route: 'Oral', frequency: '8 hourly', duration: '7 days', indication: 'Suspected Giardia or amoebic dysentery (bloody diarrhoea)' },
        { medication: 'Ciprofloxacin', dose: '500mg', route: 'Oral', frequency: '12 hourly', duration: '3–5 days', indication: 'Invasive bacterial diarrhoea (Salmonella, Shigella) — not routinely recommended' },
      ],
      investigations: [
        { name: 'Stool M/C/S', urgency: 'ROUTINE', rationale: 'Only if bloody diarrhoea, immunocompromised, prolonged illness > 7 days' },
        { name: 'Renal function (U&E)', urgency: 'URGENT', rationale: 'Assess dehydration severity and electrolyte imbalance' },
        { name: 'HIV rapid test', urgency: 'ROUTINE', rationale: 'Chronic diarrhoea — important HIV-related cause' },
      ],
      referralCriteria: 'Severe dehydration, haemodynamic compromise, bloody diarrhoea with fever, unable to tolerate oral fluids, very young or elderly',
      redFlags: 'Signs of severe dehydration, blood in stool, high fever, altered consciousness, no urine output > 8 hours',
      followUpAdvice: 'Return immediately if worsening, blood in stool, or unable to tolerate fluids.',
      notes: 'Rotavirus vaccine (part of SA EPI) has significantly reduced childhood gastro morbidity. Avoid anti-motility agents in children < 12 years.',
      saPrevalence: 'Common',
    },
  },
  // ── Genitourinary ─────────────────────────────────────
  {
    code: 'N39.0',
    description: 'Urinary tract infection, site not specified',
    icdCategory: 'Genitourinary',
    condition: {
      conditionName: 'Urinary Tract Infection (UTI)',
      synonyms: ['cystitis', 'bladder infection', 'urinary infection'],
      category: 'Genitourinary',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Nitrofurantoin', dose: '100mg (modified release)', route: 'Oral', frequency: 'Twice daily', duration: '5 days', notes: 'Uncomplicated UTI in women; avoid if eGFR < 30 or pregnancy near term' },
        { medication: 'Trimethoprim', dose: '200mg', route: 'Oral', frequency: 'Twice daily', duration: '7 days', notes: 'Only if local resistance < 20%' },
      ],
      alternativeTreatment: [
        { medication: 'Amoxicillin-Clavulanate', dose: '875/125mg', route: 'Oral', frequency: '12 hourly', duration: '7 days', indication: 'Pregnancy-associated UTI or complicated UTI' },
        { medication: 'Ciprofloxacin', dose: '500mg', route: 'Oral', frequency: '12 hourly', duration: '3–7 days', indication: 'Complicated UTI, pyelonephritis, male UTI' },
      ],
      investigations: [
        { name: 'Urine dipstick (leucocytes, nitrites, blood)', urgency: 'ROUTINE', rationale: 'Rapid bedside diagnosis' },
        { name: 'MSU for M/C/S', urgency: 'ROUTINE', rationale: 'Recurrent UTI, treatment failure, pregnancy, or atypical presentation' },
        { name: 'Urine pregnancy test', urgency: 'ROUTINE', rationale: 'Important in women of childbearing age — affects antibiotic choice' },
        { name: 'Renal ultrasound', urgency: 'ROUTINE', rationale: 'Structural abnormality if recurrent UTI or pyelonephritis' },
      ],
      referralCriteria: 'Pyelonephritis (systemically unwell, rigors, costovertebral angle tenderness), UTI in men, recurrent UTI (> 2/year)',
      redFlags: 'High fever with rigors, costovertebral angle tenderness (pyelonephritis), haematuria with clots, inability to void, sepsis signs',
      followUpAdvice: 'Test of cure MSU at 7 days in pregnancy. Return if symptoms persist beyond 48 hours of antibiotics.',
      notes: 'Women: wipe front to back, post-coital voiding, adequate hydration. Men with UTI require urological evaluation.',
      saPrevalence: 'Common',
    },
  },
  // ── Dermatology ───────────────────────────────────────
  {
    code: 'L08.9',
    description: 'Local infection of skin and subcutaneous tissue, unspecified',
    icdCategory: 'Dermatology',
    condition: {
      conditionName: 'Cellulitis / Skin and Soft Tissue Infection',
      synonyms: ['cellulitis', 'impetigo', 'abscess', 'wound infection', 'SSTI'],
      category: 'Dermatology',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Cloxacillin', dose: '500mg', route: 'Oral', frequency: '6 hourly', duration: '7 days', notes: 'First line for Staphylococcal infections; take on empty stomach' },
        { medication: 'Amoxicillin-Clavulanate', dose: '875/125mg', route: 'Oral', frequency: '12 hourly', duration: '7 days', notes: 'Broader spectrum; useful for mixed infections, bites, diabetic foot' },
      ],
      alternativeTreatment: [
        { medication: 'Cefalexin', dose: '500mg', route: 'Oral', frequency: '6 hourly', duration: '7 days', indication: 'Penicillin allergy (non-anaphylactic)' },
        { medication: 'Clindamycin', dose: '300mg', route: 'Oral', frequency: '8 hourly', duration: '7 days', indication: 'Penicillin anaphylaxis; MRSA coverage in high-risk patients' },
      ],
      investigations: [
        { name: 'Wound swab M/C/S', urgency: 'ROUTINE', rationale: 'Purulent wounds, treatment failure, or diabetic foot' },
        { name: 'FBC, CRP', urgency: 'ROUTINE', rationale: 'Systemic inflammatory response assessment' },
        { name: 'Blood culture', urgency: 'URGENT', rationale: 'Systemic features or immune compromise' },
        { name: 'Blood glucose / HbA1c', urgency: 'ROUTINE', rationale: 'Exclude diabetes as predisposing factor' },
      ],
      referralCriteria: 'Spreading cellulitis despite 48 hours of antibiotics, systemic toxicity, necrotising fasciitis, diabetic foot, abscess requiring I&D',
      redFlags: 'Crepitus (necrotising fasciitis), rapidly spreading erythema, haemodynamic instability, deep tissue involvement',
      followUpAdvice: 'Review in 48 hours to confirm response. Mark margins with permanent pen for monitoring.',
      notes: 'Elevate affected limb. Identify and treat predisposing factors (diabetes, lymphoedema, venous disease). MRSA increasingly common in SA.',
      saPrevalence: 'Common',
    },
  },
  // ── Mental Health ────────────────────────────────────
  {
    code: 'F32.9',
    description: 'Major depressive disorder, single episode, unspecified',
    icdCategory: 'Mental Health',
    condition: {
      conditionName: 'Depression',
      synonyms: ['major depressive disorder', 'MDD', 'clinical depression'],
      category: 'Mental Health',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Fluoxetine', dose: '20mg', route: 'Oral', frequency: 'Once daily (morning)', duration: 'Minimum 6 months (first episode)', notes: 'SSRI first line; takes 2–4 weeks for therapeutic effect' },
      ],
      alternativeTreatment: [
        { medication: 'Sertraline', dose: '50mg, titrate to 100–200mg', route: 'Oral', frequency: 'Once daily', duration: 'Minimum 6 months', indication: 'Preferred in post-MI or cardiac disease; better GI tolerability' },
        { medication: 'Amitriptyline', dose: '25–75mg', route: 'Oral', frequency: 'At night', duration: 'Minimum 6 months', indication: 'Co-morbid neuropathic pain or insomnia; NOT in suicidal patients (overdose risk)' },
      ],
      investigations: [
        { name: 'PHQ-9 depression scale', urgency: 'ROUTINE', rationale: 'Standardised severity assessment and monitoring' },
        { name: 'Thyroid function tests (TSH)', urgency: 'ROUTINE', rationale: 'Hypothyroidism mimics and causes depression' },
        { name: 'FBC', urgency: 'ROUTINE', rationale: 'Exclude anaemia as contributing factor' },
        { name: 'HIV test', urgency: 'ROUTINE', rationale: 'HIV-associated depression common in SA' },
        { name: 'Substance use screen (AUDIT/ASSIST)', urgency: 'ROUTINE', rationale: 'Comorbid substance use is very common' },
      ],
      referralCriteria: 'Active suicidal ideation with plan/intent, psychotic features, bipolar disorder, severe depression, non-response to 2 adequate antidepressant trials',
      redFlags: 'Active suicidal ideation, self-harm, inability to care for self, psychotic symptoms, rapid deterioration',
      followUpAdvice: 'Review 2–4 weeks after starting treatment. Monthly until remission. 6-monthly thereafter. Always assess suicidality.',
      notes: 'Psychotherapy (CBT, IPT) is as effective as medication. Screen for bipolar disorder before prescribing antidepressants.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'F41.1',
    description: 'Generalized anxiety disorder',
    icdCategory: 'Mental Health',
    condition: {
      conditionName: 'Generalised Anxiety Disorder (GAD)',
      synonyms: ['GAD', 'generalised anxiety', 'anxiety disorder'],
      category: 'Mental Health',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Escitalopram', dose: '10mg', route: 'Oral', frequency: 'Once daily', duration: 'Minimum 12 months', notes: 'SSRI first-line; slow onset of anxiolytic effect (2–4 weeks)' },
        { medication: 'Sertraline', dose: '50mg', route: 'Oral', frequency: 'Once daily', duration: 'Minimum 12 months', notes: 'Alternative SSRI' },
      ],
      alternativeTreatment: [
        { medication: 'Buspirone', dose: '5mg BD, titrate to 15mg BD', route: 'Oral', frequency: 'Twice daily', duration: 'Minimum 12 months', indication: 'Non-sedating, non-addictive alternative; takes 2–4 weeks to work' },
      ],
      investigations: [
        { name: 'GAD-7 scale', urgency: 'ROUTINE', rationale: 'Standardised severity assessment' },
        { name: 'Thyroid function tests (TSH)', urgency: 'ROUTINE', rationale: 'Hyperthyroidism mimics anxiety' },
        { name: 'ECG (if palpitations present)', urgency: 'ROUTINE', rationale: 'Exclude arrhythmia as cause of palpitations' },
      ],
      referralCriteria: 'Non-response to 2 adequate pharmacological trials, panic disorder with agoraphobia, suicidal ideation, comorbid psychosis',
      redFlags: 'Suicidal ideation, severe functional impairment, psychotic symptoms',
      followUpAdvice: 'Review 2–4 weeks after starting medication. Monthly until controlled. Reassess need for medication at 12 months.',
      notes: 'Benzodiazepines should only be used SHORT-TERM (max 2–4 weeks) due to dependence risk. CBT is the most effective psychological treatment.',
      saPrevalence: 'Common',
    },
  },
  // ── Obstetrics & Gynaecology ────────────────────────
  {
    code: 'O14.1',
    description: 'Severe pre-eclampsia',
    icdCategory: 'Obstetrics and Gynaecology',
    condition: {
      conditionName: 'Pre-eclampsia / Severe Pre-eclampsia',
      synonyms: ['PET', 'eclampsia', 'gestational hypertension with proteinuria', 'HELLP syndrome'],
      category: 'Obstetrics and Gynaecology',
      subCategory: 'Obstetric Complication',
      levelOfCare: 'Secondary',
      firstLineTreatment: [
        { medication: 'Magnesium Sulphate', dose: '4g IV loading dose over 20 min, then 1–2g/hour infusion', route: 'IV', frequency: 'Continuous infusion', duration: 'Until 24 hours post-delivery or last seizure', notes: 'Seizure prophylaxis; monitor RR, patellar reflexes, urine output; antidote: calcium gluconate 1g IV' },
        { medication: 'Labetalol', dose: '20mg IV, repeat at 10-min intervals up to 80mg', route: 'IV', frequency: 'Bolus then infusion as needed', duration: 'Until BP controlled, then switch to oral', notes: 'Target BP: systolic < 160, diastolic < 110' },
        { medication: 'Nifedipine (oral)', dose: '10–20mg', route: 'Oral', frequency: 'As needed, not more than 4-hourly', duration: 'Until BP controlled', notes: 'Do NOT give sublingual nifedipine (risk of rapid BP drop and placental abruption)' },
      ],
      investigations: [
        { name: 'BP (serial measurements)', urgency: 'STAT', rationale: 'Confirm diagnosis and guide treatment' },
        { name: 'Urine protein:creatinine ratio', urgency: 'URGENT', rationale: 'Confirm proteinuria (PCR > 30mg/mmol)' },
        { name: 'FBC (with platelets)', urgency: 'URGENT', rationale: 'Thrombocytopaenia in HELLP' },
        { name: 'LFTs', urgency: 'URGENT', rationale: 'HELLP: elevated transaminases and bilirubin' },
        { name: 'Uric acid, urea, creatinine', urgency: 'URGENT', rationale: 'Renal involvement assessment' },
        { name: 'CTG (Cardiotocography)', urgency: 'URGENT', rationale: 'Fetal wellbeing assessment' },
        { name: 'Ultrasound (fetal growth, liquor, Dopplers)', urgency: 'URGENT', rationale: 'FGR and placental function' },
        { name: 'Coagulation (INR, aPTT, fibrinogen)', urgency: 'URGENT', rationale: 'DIC assessment in severe disease/HELLP' },
      ],
      referralCriteria: 'ALL patients with severe pre-eclampsia require immediate obstetric referral and hospital admission. Transfer to tertiary if HELLP or eclampsia.',
      redFlags: 'Eclamptic seizure, HELLP syndrome, severe headache, visual disturbance, epigastric/RUQ pain, fetal compromise, BP > 160/110',
      followUpAdvice: 'Postnatal review at 6 weeks. Antihypertensives may be needed up to 3 months. BP check annually. Increased risk in subsequent pregnancies.',
      notes: 'Delivery is the only cure. Timing depends on gestation and severity. Corticosteroids for fetal lung maturity if preterm delivery anticipated.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'O24.4',
    description: 'Diabetes mellitus arising in pregnancy',
    icdCategory: 'Obstetrics and Gynaecology',
    condition: {
      conditionName: 'Gestational Diabetes Mellitus (GDM)',
      synonyms: ['GDM', 'diabetes in pregnancy', 'gestational diabetes'],
      category: 'Obstetrics and Gynaecology',
      subCategory: 'Obstetric Complication',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Dietary modification', dose: 'N/A', route: 'N/A', frequency: 'Ongoing', duration: 'Duration of pregnancy', notes: '3 meals + 2–3 snacks daily; complex carbohydrates, high fibre; restrict simple sugars' },
        { medication: 'Metformin', dose: '500mg BD, titrate to 2000mg/day', route: 'Oral', frequency: 'Twice daily with meals', duration: 'Duration of pregnancy', notes: 'If dietary control insufficient at 2 weeks' },
      ],
      alternativeTreatment: [
        { medication: 'Insulin', dose: 'Individualised', route: 'Subcutaneous', frequency: 'Once to four times daily', duration: 'Duration of pregnancy', indication: 'Metformin insufficient, contraindicated, or FBG > 7.0 mmol/L at diagnosis' },
      ],
      investigations: [
        { name: 'OGTT 75g (at 24–28 weeks)', urgency: 'ROUTINE', rationale: 'Diagnosis: FBG ≥ 5.1, 1h ≥ 10.0, 2h ≥ 8.5 mmol/L (IADPSG criteria)' },
        { name: 'Home glucose monitoring (SMBG)', urgency: 'ROUTINE', rationale: 'Pre-meal < 5.3, 1h post-meal < 7.8, 2h post-meal < 6.7 mmol/L' },
        { name: 'HbA1c (if diagnosis in first trimester)', urgency: 'ROUTINE', rationale: 'Distinguish GDM from pre-existing diabetes' },
        { name: 'Fetal growth scan (3-weekly from 28 weeks)', urgency: 'ROUTINE', rationale: 'Macrosomia, polyhydramnios, IUGR' },
      ],
      referralCriteria: 'GDM requiring insulin, fetal macrosomia (AC > 95th centile), HbA1c > 8%, hypoglycaemia episodes',
      redFlags: 'Hypoglycaemia (glucose < 3.5 mmol/L), ketonuria with hyperglycaemia, fetal macrosomia/IUGR',
      followUpAdvice: 'OGTT at 6–12 weeks postpartum. Annual fasting glucose thereafter (high risk T2DM). Lifestyle modification to prevent T2DM.',
      notes: 'GDM resolves after delivery in most cases but 50% develop T2DM within 10 years. Breastfeeding reduces long-term T2DM risk.',
      saPrevalence: 'Common',
    },
  },
  // ── Paediatric ─────────────────────────────────────────
  {
    code: 'H66.9',
    description: 'Otitis media, unspecified',
    icdCategory: 'Paediatric',
    condition: {
      conditionName: 'Acute Otitis Media (AOM)',
      synonyms: ['ear infection', 'middle ear infection'],
      category: 'Paediatric',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Amoxicillin', dose: '40–50mg/kg/day (max 1500mg/day)', route: 'Oral', frequency: '8 hourly', duration: '5 days (10 days if < 2 years or severe)', notes: 'First-line for AOM; watchful waiting acceptable in mild AOM in children > 2 years' },
        { medication: 'Paracetamol syrup', dose: '15mg/kg', route: 'Oral', frequency: '6 hourly PRN', duration: '3–5 days', notes: 'Analgesia and antipyretic' },
      ],
      alternativeTreatment: [
        { medication: 'Amoxicillin-Clavulanate', dose: '40mg/kg/day (amoxicillin component)', route: 'Oral', frequency: '8 hourly', duration: '5–10 days', indication: 'Treatment failure on amoxicillin, recurrent AOM, recent antibiotic use' },
        { medication: 'Azithromycin', dose: '10mg/kg/day', route: 'Oral', frequency: 'Once daily', duration: '3 days', indication: 'Penicillin allergy' },
      ],
      investigations: [
        { name: 'Otoscopy', urgency: 'ROUTINE', rationale: 'Visualise tympanic membrane — bulging, erythema, perforation, or effusion' },
        { name: 'Tympanometry', urgency: 'ROUTINE', rationale: 'Confirm middle ear effusion in recurrent cases' },
        { name: 'Audiometry', urgency: 'ROUTINE', rationale: 'Hearing loss assessment in recurrent or glue ear' },
      ],
      referralCriteria: 'Mastoiditis, meningism, facial nerve palsy, recurrent AOM (> 3 episodes in 6 months), persistent effusion (glue ear) > 3 months',
      redFlags: 'Mastoid tenderness/swelling (mastoiditis), neck stiffness (meningitis), acute facial nerve palsy',
      followUpAdvice: 'Review in 2 days if not improving. Hearing test after third episode.',
      notes: 'Pneumococcal vaccination (PCV13) and influenza vaccination reduce AOM incidence. Breastfeeding is protective.',
      saPrevalence: 'Common',
    },
  },
  {
    code: 'A09.0',
    description: 'Other and unspecified gastroenteritis and colitis due to specified organism — paediatric',
    icdCategory: 'Paediatric',
    condition: {
      conditionName: 'Childhood Diarrhoeal Disease',
      synonyms: ['paediatric diarrhoea', 'childhood gastroenteritis', 'acute diarrhoea in children'],
      category: 'Paediatric',
      subCategory: 'Childhood Illness',
      levelOfCare: 'Primary',
      firstLineTreatment: [
        { medication: 'Oral Rehydration Solution (ORS)', dose: '50–100mL/kg over 3–4 hours (mild-moderate dehydration)', route: 'Oral', frequency: 'Small frequent sips; extra 10mL/kg after each loose stool', duration: 'Until rehydrated and diarrhoea stops', notes: 'WHO/UNICEF low-osmolarity ORS; nasogastric if unable to drink' },
        { medication: 'Zinc sulphate', dose: '< 6 months: 10mg; ≥ 6 months: 20mg', route: 'Oral', frequency: 'Once daily', duration: '10–14 days', notes: 'Evidence-based; reduces duration and recurrence of diarrhoea' },
      ],
      investigations: [
        { name: 'Assess dehydration clinically', urgency: 'STAT', rationale: 'WHO dehydration classification guides management: no/some/severe dehydration' },
        { name: 'Stool M/C/S (if bloody)', urgency: 'URGENT', rationale: 'Dysentery: Shigella, Salmonella, Campylobacter, E. coli O157' },
        { name: 'Rotavirus antigen (stool)', urgency: 'ROUTINE', rationale: 'Commonest cause of severe childhood diarrhoea in SA' },
        { name: 'Electrolytes (U&E)', urgency: 'URGENT', rationale: 'Severe dehydration or prolonged illness; hypo/hypernatraemia can be fatal' },
        { name: 'Blood glucose', urgency: 'STAT', rationale: 'Hypoglycaemia is common and life-threatening in malnourished children with diarrhoea' },
      ],
      referralCriteria: 'Severe dehydration (sunken eyes, absent tears, skin pinch > 3 sec, lethargic), inability to drink, bloody diarrhoea with systemic toxicity',
      redFlags: 'Sunken fontanelle, absent tears, lethargy, > 6 watery stools/hour, blood in stool, no urine output > 8h',
      followUpAdvice: 'Return immediately if: unable to drink, very frequent stools, blood in stool, or worsening. Continue normal feeding throughout.',
      notes: 'Continue breastfeeding throughout. Do NOT use anti-motility drugs (loperamide) in children. Do NOT routinely give antibiotics.',
      saPrevalence: 'Common',
    },
  },
];

async function main() {
  console.log('Seeding STG entries...');
  let count = 0;

  for (const entry of CONDITIONS) {
    await prisma.$transaction(async (tx) => {
      await tx.iCD10Code.upsert({
        where: { code: entry.code },
        update: { description: entry.description, category: entry.icdCategory },
        create: {
          code: entry.code,
          description: entry.description,
          category: entry.icdCategory,
          isLeaf: true,
        },
      });

      await tx.sTGEntry.upsert({
        where: { icd10Code: entry.code },
        update: {
          conditionName: entry.condition.conditionName,
          synonyms: entry.condition.synonyms,
          category: entry.condition.category,
          subCategory: entry.condition.subCategory ?? null,
          levelOfCare: entry.condition.levelOfCare,
          firstLineTreatment: entry.condition.firstLineTreatment,
          alternativeTreatment: entry.condition.alternativeTreatment ?? undefined,
          investigations: entry.condition.investigations,
          referralCriteria: entry.condition.referralCriteria ?? null,
          redFlags: entry.condition.redFlags ?? null,
          followUpAdvice: entry.condition.followUpAdvice ?? null,
          notes: entry.condition.notes ?? null,
          saPrevalence: entry.condition.saPrevalence,
        },
        create: {
          icd10Code: entry.code,
          conditionName: entry.condition.conditionName,
          synonyms: entry.condition.synonyms,
          category: entry.condition.category,
          subCategory: entry.condition.subCategory ?? null,
          levelOfCare: entry.condition.levelOfCare,
          firstLineTreatment: entry.condition.firstLineTreatment,
          alternativeTreatment: entry.condition.alternativeTreatment ?? undefined,
          investigations: entry.condition.investigations,
          referralCriteria: entry.condition.referralCriteria ?? null,
          redFlags: entry.condition.redFlags ?? null,
          followUpAdvice: entry.condition.followUpAdvice ?? null,
          notes: entry.condition.notes ?? null,
          saPrevalence: entry.condition.saPrevalence,
        },
      });

      count++;
      console.log(`  ✓ [${entry.code}] ${entry.condition.conditionName}`);
    });
  }

  console.log(`\nSTG seeding complete. ${count} conditions seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
