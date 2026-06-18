/**
 * ICD-10 Common Codes for South African Primary Care
 * ~200 codes covering the most prevalent conditions in SA primary healthcare settings
 *
 * Sources:
 * - WHO ICD-10 Version 2019
 * - South African Department of Health STG lists
 * - District Health Information System (DHIS2) commonly coded conditions
 */

export interface ICD10Code {
  code: string;
  description: string;
  category: string;
  saPrevalence: 'Very Common' | 'Common' | 'Uncommon';
  keywords: string[];
}

export const ICD10_COMMON_CODES: ICD10Code[] = [
  // ============================================================
  // INFECTIOUS AND PARASITIC DISEASES (A00-B99)
  // ============================================================
  {
    code: 'A00.9',
    description: 'Cholera, unspecified',
    category: 'Infectious',
    saPrevalence: 'Uncommon',
    keywords: ['cholera', 'rice water stool', 'dehydration', 'vibrio'],
  },
  {
    code: 'A01.0',
    description: 'Typhoid fever',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['typhoid', 'enteric fever', 'salmonella typhi', 'rose spots'],
  },
  {
    code: 'A06.0',
    description: 'Acute amoebic dysentery',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['amoebiasis', 'entamoeba histolytica', 'bloody diarrhoea', 'dysentery'],
  },
  {
    code: 'A09',
    description: 'Infectious gastroenteritis and colitis, unspecified',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['gastro', 'diarrhoea', 'vomiting', 'dehydration', 'gastroenteritis'],
  },
  {
    code: 'A15.0',
    description: 'Tuberculosis of lung, confirmed by sputum microscopy',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['TB', 'tuberculosis', 'pulmonary TB', 'cough', 'haemoptysis', 'night sweats'],
  },
  {
    code: 'A16.2',
    description: 'Tuberculosis of lung, without mention of bacteriological or histological confirmation',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['TB', 'tuberculosis', 'clinical TB', 'cough', 'weight loss'],
  },
  {
    code: 'A17.0',
    description: 'Tuberculous meningitis',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ['TB meningitis', 'tuberculous meningitis', 'headache', 'stiff neck', 'photophobia'],
  },
  {
    code: 'A19.9',
    description: 'Miliary tuberculosis, unspecified',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['miliary TB', 'disseminated TB', 'fever', 'weight loss'],
  },
  {
    code: 'A36',
    description: 'Diphtheria',
    category: 'Infectious',
    saPrevalence: 'Uncommon',
    keywords: ['diphtheria', 'corynebacterium', 'pseudomembrane', 'bull neck', 'laryngeal obstruction'],
  },
  {
    code: 'A37.9',
    description: 'Whooping cough, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Common',
    keywords: ['pertussis', 'whooping cough', 'bordetella', 'paroxysmal cough', 'whoop'],
  },
  {
    code: 'A39.9',
    description: 'Meningococcal infection, unspecified',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['meningococcal', 'neisseria meningitidis', 'meningitis', 'purpuric rash', 'septicaemia'],
  },
  {
    code: 'A41.9',
    description: 'Sepsis, unspecified organism',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['sepsis', 'septicaemia', 'blood poisoning', 'fever', 'hypotension', 'tachycardia'],
  },
  {
    code: 'A51.0',
    description: 'Primary genital syphilis',
    category: 'Sexually Transmitted Infections',
    saPrevalence: 'Very Common',
    keywords: ['syphilis', 'treponema pallidum', 'chancre', 'painless ulcer', 'STI'],
  },
  {
    code: 'A52.9',
    description: 'Late syphilis, unspecified',
    category: 'Sexually Transmitted Infections',
    saPrevalence: 'Common',
    keywords: ['late syphilis', 'tertiary syphilis', 'neurosyphilis', 'cardiovascular syphilis'],
  },
  {
    code: 'A54.9',
    description: 'Gonococcal infection, unspecified',
    category: 'Sexually Transmitted Infections',
    saPrevalence: 'Very Common',
    keywords: ['gonorrhoea', 'neisseria gonorrhoeae', 'urethral discharge', 'pelvic pain', 'STI'],
  },
  {
    code: 'A59.0',
    description: 'Urogenital trichomoniasis',
    category: 'Sexually Transmitted Infections',
    saPrevalence: 'Very Common',
    keywords: ['trichomoniasis', 'trichomonas vaginalis', 'vaginal discharge', 'frothy discharge'],
  },
  {
    code: 'A69.2',
    description: 'Lyme disease',
    category: 'Infectious',
    saPrevalence: 'Uncommon',
    keywords: ['lyme disease', 'borrelia', 'tick bite', 'bulls eye rash', 'erythema migrans'],
  },
  {
    code: 'A74.9',
    description: 'Chlamydial infection, unspecified',
    category: 'Sexually Transmitted Infections',
    saPrevalence: 'Very Common',
    keywords: ['chlamydia', 'chlamydial infection', 'pelvic pain', 'discharge', 'STI'],
  },
  {
    code: 'A75.9',
    description: 'Typhus fever, unspecified',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['typhus', 'rickettsia', 'tick typhus', 'fever', 'rash', 'eschar'],
  },
  {
    code: 'A77.1',
    description: 'Spotted fever due to Rickettsia conorii (Mediterranean/African tick bite fever)',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['tick bite fever', 'rickettsia conorii', 'eschar', 'rash', 'fever', 'TBF'],
  },
  {
    code: 'A82.9',
    description: 'Rabies, unspecified',
    category: 'Infectious',
    saPrevalence: 'Uncommon',
    keywords: ['rabies', 'hydrophobia', 'animal bite', 'encephalitis'],
  },
  {
    code: 'A90',
    description: 'Dengue fever [classical dengue]',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['dengue', 'breakbone fever', 'aedes mosquito', 'myalgia', 'rash', 'thrombocytopaenia'],
  },
  {
    code: 'B00.9',
    description: 'Herpesviral infection, unspecified',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['herpes', 'HSV', 'cold sore', 'genital herpes', 'blisters', 'vesicles'],
  },
  {
    code: 'B02.9',
    description: 'Zoster without complications (Shingles)',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['shingles', 'herpes zoster', 'VZV', 'dermatomal rash', 'burning pain', 'post-herpetic neuralgia'],
  },
  {
    code: 'B05',
    description: 'Measles',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['measles', 'rubeola', 'morbilli virus', 'Koplik spots', 'rash', 'cough'],
  },
  {
    code: 'B06.9',
    description: 'Rubella without complication',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['rubella', 'german measles', 'rash', 'lymphadenopathy', 'congenital rubella'],
  },
  {
    code: 'B15.9',
    description: 'Acute hepatitis A without hepatic coma',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['hepatitis A', 'HAV', 'jaundice', 'liver', 'nausea', 'dark urine'],
  },
  {
    code: 'B16.9',
    description: 'Acute hepatitis B without delta-agent and without hepatic coma',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['hepatitis B', 'HBV', 'jaundice', 'liver', 'cirrhosis', 'hepatocellular carcinoma'],
  },
  {
    code: 'B18.1',
    description: 'Chronic viral hepatitis B without delta-agent',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['chronic hepatitis B', 'HBsAg', 'HBeAg', 'liver fibrosis', 'hepatitis'],
  },
  {
    code: 'B19.9',
    description: 'Unspecified viral hepatitis without hepatic coma',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['viral hepatitis', 'jaundice', 'liver', 'nausea', 'hepatitis'],
  },
  {
    code: 'B20',
    description: 'Human immunodeficiency virus [HIV] disease resulting in infectious and parasitic diseases',
    category: 'HIV/AIDS',
    saPrevalence: 'Very Common',
    keywords: ['HIV', 'AIDS', 'HIV disease', 'AIDS-defining illness', 'opportunistic infection'],
  },
  {
    code: 'B24',
    description: 'Unspecified human immunodeficiency virus [HIV] disease',
    category: 'HIV/AIDS',
    saPrevalence: 'Very Common',
    keywords: ['HIV', 'AIDS', 'advanced HIV', 'AIDS', 'immunosuppression'],
  },
  {
    code: 'B35.4',
    description: 'Tinea pedis (Athlete\'s foot)',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ["tinea pedis", "athlete's foot", "fungal infection", "itchy feet", "interdigital"],
  },
  {
    code: 'B35.6',
    description: 'Tinea inguinalis (Jock itch)',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['tinea cruris', 'jock itch', 'groin rash', 'fungal infection'],
  },
  {
    code: 'B37.0',
    description: 'Candidal stomatitis (Oral thrush)',
    category: 'Infectious',
    saPrevalence: 'Very Common',
    keywords: ['oral thrush', 'candida', 'white patches', 'mouth infection', 'HIV-related'],
  },
  {
    code: 'B37.3',
    description: 'Candidiasis of vulva and vagina',
    category: 'Women\'s Health',
    saPrevalence: 'Very Common',
    keywords: ['vaginal thrush', 'candida', 'vulvovaginitis', 'white discharge', 'itching'],
  },
  {
    code: 'B44.1',
    description: 'Other pulmonary aspergillosis',
    category: 'Respiratory',
    saPrevalence: 'Common',
    keywords: ['aspergillosis', 'aspergillus', 'pulmonary fungal', 'haemoptysis', 'HIV'],
  },
  {
    code: 'B45.1',
    description: 'Pulmonary cryptococcosis',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['cryptococcus', 'cryptococcal meningitis', 'CrAg', 'fungal meningitis', 'HIV'],
  },
  {
    code: 'B50.9',
    description: 'Plasmodium falciparum malaria, unspecified',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['malaria', 'falciparum', 'fever', 'Plasmodium', 'mosquito', 'Limpopo', 'KZN', 'Mpumalanga'],
  },
  {
    code: 'B54',
    description: 'Unspecified malaria',
    category: 'Infectious',
    saPrevalence: 'Common',
    keywords: ['malaria', 'fever', 'chills', 'rigors', 'endemic area', 'malaria rapid test'],
  },
  {
    code: 'B85.9',
    description: 'Pediculosis, unspecified',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['lice', 'head lice', 'pediculosis', 'itching scalp', 'nits'],
  },
  {
    code: 'B86',
    description: 'Scabies',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['scabies', 'sarcoptes scabiei', 'intense itch', 'burrows', 'interdigital itch', 'night itch'],
  },

  // ============================================================
  // NEOPLASMS (C00-D48)
  // ============================================================
  {
    code: 'C15.9',
    description: 'Malignant neoplasm of oesophagus, unspecified',
    category: 'Oncology',
    saPrevalence: 'Very Common',
    keywords: ['oesophageal cancer', 'dysphagia', 'weight loss', 'Transkei', 'Southern Africa'],
  },
  {
    code: 'C18.9',
    description: 'Malignant neoplasm of colon, unspecified',
    category: 'Oncology',
    saPrevalence: 'Common',
    keywords: ['colon cancer', 'colorectal cancer', 'rectal bleeding', 'bowel habit change', 'weight loss'],
  },
  {
    code: 'C20',
    description: 'Malignant neoplasm of rectum',
    category: 'Oncology',
    saPrevalence: 'Common',
    keywords: ['rectal cancer', 'rectal bleeding', 'tenesmus', 'weight loss'],
  },
  {
    code: 'C34.9',
    description: 'Malignant neoplasm of bronchus and lung, unspecified',
    category: 'Oncology',
    saPrevalence: 'Common',
    keywords: ['lung cancer', 'bronchogenic carcinoma', 'haemoptysis', 'weight loss', 'smoking'],
  },
  {
    code: 'C50.9',
    description: 'Malignant neoplasm of breast, unspecified',
    category: 'Oncology',
    saPrevalence: 'Very Common',
    keywords: ['breast cancer', 'breast lump', 'nipple discharge', 'breast mass'],
  },
  {
    code: 'C53.9',
    description: 'Malignant neoplasm of cervix uteri, unspecified',
    category: 'Oncology',
    saPrevalence: 'Very Common',
    keywords: ['cervical cancer', 'HPV', 'postcoital bleeding', 'abnormal Pap smear', 'vaginal discharge'],
  },
  {
    code: 'C61',
    description: 'Malignant neoplasm of prostate',
    category: 'Oncology',
    saPrevalence: 'Very Common',
    keywords: ['prostate cancer', 'PSA', 'urinary symptoms', 'bone pain', 'elevated PSA'],
  },
  {
    code: 'C81.9',
    description: 'Hodgkin\'s lymphoma, unspecified',
    category: 'Oncology',
    saPrevalence: 'Common',
    keywords: ['Hodgkin lymphoma', 'lymphadenopathy', 'B symptoms', 'night sweats', 'weight loss'],
  },
  {
    code: 'C85.9',
    description: 'Non-Hodgkin\'s lymphoma, unspecified',
    category: 'Oncology',
    saPrevalence: 'Very Common',
    keywords: ['NHL', 'non-Hodgkin lymphoma', 'lymphadenopathy', 'HIV-related', 'B symptoms'],
  },
  {
    code: 'C91.0',
    description: 'Acute lymphoblastic leukaemia',
    category: 'Oncology',
    saPrevalence: 'Common',
    keywords: ['ALL', 'acute lymphoblastic leukaemia', 'childhood leukaemia', 'bruising', 'pallor'],
  },

  // ============================================================
  // ENDOCRINE AND METABOLIC (E00-E90)
  // ============================================================
  {
    code: 'E03.9',
    description: 'Hypothyroidism, unspecified',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['hypothyroid', 'underactive thyroid', 'fatigue', 'weight gain', 'cold intolerance', 'TSH elevated'],
  },
  {
    code: 'E05.9',
    description: 'Thyrotoxicosis, unspecified (Hyperthyroidism)',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['hyperthyroid', 'thyrotoxicosis', 'Graves disease', 'palpitations', 'weight loss', 'TSH low'],
  },
  {
    code: 'E10.9',
    description: 'Type 1 diabetes mellitus without complications',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['Type 1 diabetes', 'DM1', 'insulin-dependent', 'DKA', 'juvenile diabetes'],
  },
  {
    code: 'E11.9',
    description: 'Type 2 diabetes mellitus without complications',
    category: 'Endocrine',
    saPrevalence: 'Very Common',
    keywords: ['Type 2 diabetes', 'DM2', 'NIDDM', 'diabetes', 'hyperglycaemia', 'insulin resistance'],
  },
  {
    code: 'E14.9',
    description: 'Unspecified diabetes mellitus without complications',
    category: 'Endocrine',
    saPrevalence: 'Very Common',
    keywords: ['diabetes', 'DM', 'diabetes mellitus', 'sugar diabetes', 'high blood sugar'],
  },
  {
    code: 'E11.2',
    description: 'Type 2 diabetes mellitus with diabetic nephropathy',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['diabetic nephropathy', 'proteinuria', 'CKD', 'diabetes', 'renal failure'],
  },
  {
    code: 'E11.3',
    description: 'Type 2 diabetes mellitus with ophthalmic complications',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['diabetic retinopathy', 'diabetes', 'visual loss', 'proliferative retinopathy'],
  },
  {
    code: 'E11.4',
    description: 'Type 2 diabetes mellitus with neurological complications',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['diabetic neuropathy', 'peripheral neuropathy', 'burning feet', 'diabetes'],
  },
  {
    code: 'E11.5',
    description: 'Type 2 diabetes mellitus with peripheral circulatory complications',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['diabetic foot', 'peripheral vascular disease', 'foot ulcer', 'gangrene', 'diabetes'],
  },
  {
    code: 'E16.0',
    description: 'Drug-induced hypoglycaemia without coma',
    category: 'Endocrine',
    saPrevalence: 'Very Common',
    keywords: ['hypoglycaemia', 'low blood sugar', 'shaking', 'sweating', 'confusion', 'insulin overdose'],
  },
  {
    code: 'E27.4',
    description: 'Other and unspecified adrenocortical insufficiency (Addison\'s disease)',
    category: 'Endocrine',
    saPrevalence: 'Common',
    keywords: ['Addison disease', 'adrenal insufficiency', 'hyperpigmentation', 'fatigue', 'HIV-related'],
  },
  {
    code: 'E44.0',
    description: 'Moderate protein-energy malnutrition',
    category: 'Nutritional',
    saPrevalence: 'Very Common',
    keywords: ['malnutrition', 'underweight', 'wasting', 'PEM', 'child malnutrition'],
  },
  {
    code: 'E46',
    description: 'Unspecified protein-energy malnutrition',
    category: 'Nutritional',
    saPrevalence: 'Very Common',
    keywords: ['malnutrition', 'kwashiorkor', 'marasmus', 'failure to thrive', 'undernutrition'],
  },
  {
    code: 'E66.9',
    description: 'Obesity, unspecified',
    category: 'Nutritional',
    saPrevalence: 'Very Common',
    keywords: ['obesity', 'overweight', 'BMI', 'adiposity', 'weight gain'],
  },
  {
    code: 'E78.5',
    description: 'Hyperlipidaemia, unspecified',
    category: 'Endocrine',
    saPrevalence: 'Very Common',
    keywords: ['hyperlipidaemia', 'high cholesterol', 'dyslipidaemia', 'LDL', 'triglycerides'],
  },
  {
    code: 'E87.6',
    description: 'Hypokalaemia',
    category: 'Metabolic',
    saPrevalence: 'Common',
    keywords: ['hypokalaemia', 'low potassium', 'muscle weakness', 'diuretics', 'vomiting'],
  },

  // ============================================================
  // MENTAL AND BEHAVIOURAL DISORDERS (F00-F99)
  // ============================================================
  {
    code: 'F10.1',
    description: 'Mental and behavioural disorders due to use of alcohol — harmful use',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['alcohol', 'alcohol use disorder', 'harmful drinking', 'alcoholism'],
  },
  {
    code: 'F12.1',
    description: 'Mental and behavioural disorders due to use of cannabinoids — harmful use',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['cannabis', 'dagga', 'marijuana', 'substance use', 'psychosis'],
  },
  {
    code: 'F19.1',
    description: 'Mental and behavioural disorders due to multiple drug use — harmful use (Methamphetamine/Tik)',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['tik', 'methamphetamine', 'nyaope', 'whoonga', 'substance abuse', 'multiple drug use'],
  },
  {
    code: 'F20.9',
    description: 'Schizophrenia, unspecified',
    category: 'Mental Health',
    saPrevalence: 'Common',
    keywords: ['schizophrenia', 'psychosis', 'hallucinations', 'delusions', 'thought disorder'],
  },
  {
    code: 'F31.9',
    description: 'Bipolar affective disorder, unspecified',
    category: 'Mental Health',
    saPrevalence: 'Common',
    keywords: ['bipolar', 'manic depression', 'mania', 'mood swings', 'bipolar disorder'],
  },
  {
    code: 'F32.9',
    description: 'Depressive episode, unspecified',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['depression', 'low mood', 'sadness', 'hopelessness', 'anhedonia', 'MDD'],
  },
  {
    code: 'F41.1',
    description: 'Generalised anxiety disorder',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['anxiety', 'GAD', 'worry', 'nervousness', 'palpitations', 'generalised anxiety'],
  },
  {
    code: 'F41.0',
    description: 'Panic disorder [episodic paroxysmal anxiety]',
    category: 'Mental Health',
    saPrevalence: 'Common',
    keywords: ['panic disorder', 'panic attack', 'palpitations', 'chest tightness', 'agoraphobia'],
  },
  {
    code: 'F43.1',
    description: 'Post-traumatic stress disorder',
    category: 'Mental Health',
    saPrevalence: 'Very Common',
    keywords: ['PTSD', 'trauma', 'nightmares', 'flashbacks', 'hypervigilance', 'GBV'],
  },
  {
    code: 'F60.3',
    description: 'Emotionally unstable personality disorder (Borderline PD)',
    category: 'Mental Health',
    saPrevalence: 'Common',
    keywords: ['BPD', 'borderline personality', 'self-harm', 'emotional dysregulation', 'impulsivity'],
  },
  {
    code: 'F84.0',
    description: 'Childhood autism',
    category: 'Mental Health',
    saPrevalence: 'Common',
    keywords: ['autism', 'ASD', 'developmental delay', 'social communication', 'repetitive behaviour'],
  },

  // ============================================================
  // NERVOUS SYSTEM (G00-G99)
  // ============================================================
  {
    code: 'G03.9',
    description: 'Meningitis, unspecified',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ['meningitis', 'stiff neck', 'photophobia', 'headache', 'fever', 'kernig'],
  },
  {
    code: 'G20',
    description: 'Parkinson\'s disease',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ["Parkinson's disease", 'tremor', 'rigidity', 'bradykinesia', 'shuffling gait'],
  },
  {
    code: 'G40.9',
    description: 'Epilepsy, unspecified',
    category: 'Neurological',
    saPrevalence: 'Very Common',
    keywords: ['epilepsy', 'seizure', 'fits', 'convulsion', 'tonic-clonic', 'epileptic'],
  },
  {
    code: 'G43.9',
    description: 'Migraine, unspecified',
    category: 'Neurological',
    saPrevalence: 'Very Common',
    keywords: ['migraine', 'headache', 'nausea', 'photophobia', 'phonophobia', 'aura'],
  },
  {
    code: 'G45.9',
    description: 'Transient cerebral ischaemic attack, unspecified (TIA)',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ['TIA', 'mini stroke', 'transient ischaemic attack', 'facial droop', 'arm weakness'],
  },
  {
    code: 'G46.3',
    description: 'Pure motor lacunar syndrome',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ['lacunar stroke', 'motor stroke', 'hypertension', 'white matter'],
  },
  {
    code: 'G62.9',
    description: 'Polyneuropathy, unspecified',
    category: 'Neurological',
    saPrevalence: 'Very Common',
    keywords: ['peripheral neuropathy', 'polyneuropathy', 'burning feet', 'HIV', 'diabetes', 'isoniazid'],
  },

  // ============================================================
  // EYE (H00-H59)
  // ============================================================
  {
    code: 'H10.9',
    description: 'Conjunctivitis, unspecified',
    category: 'Ophthalmology',
    saPrevalence: 'Very Common',
    keywords: ['conjunctivitis', 'pink eye', 'red eye', 'discharge', 'itchy eye'],
  },
  {
    code: 'H25.9',
    description: 'Senile cataract, unspecified',
    category: 'Ophthalmology',
    saPrevalence: 'Very Common',
    keywords: ['cataract', 'visual loss', 'cloudy lens', 'blurred vision'],
  },
  {
    code: 'H40.9',
    description: 'Glaucoma, unspecified',
    category: 'Ophthalmology',
    saPrevalence: 'Very Common',
    keywords: ['glaucoma', 'raised IOP', 'visual field loss', 'optic nerve'],
  },

  // ============================================================
  // EAR (H60-H99)
  // ============================================================
  {
    code: 'H66.9',
    description: 'Otitis media, unspecified',
    category: 'ENT',
    saPrevalence: 'Very Common',
    keywords: ['ear infection', 'otitis media', 'ear pain', 'ear discharge', 'hearing loss'],
  },
  {
    code: 'H81.0',
    description: 'Ménière\'s disease',
    category: 'ENT',
    saPrevalence: 'Common',
    keywords: ["Meniere's disease", 'vertigo', 'tinnitus', 'hearing loss', 'ear fullness'],
  },

  // ============================================================
  // CARDIOVASCULAR SYSTEM (I00-I99)
  // ============================================================
  {
    code: 'I00',
    description: 'Rheumatic fever without heart involvement',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['rheumatic fever', 'streptococcal', 'joint pain', 'chorea', 'Sydenham'],
  },
  {
    code: 'I05.0',
    description: 'Mitral stenosis',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['mitral stenosis', 'rheumatic heart disease', 'murmur', 'dyspnoea', 'AF'],
  },
  {
    code: 'I10',
    description: 'Essential (primary) hypertension',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['hypertension', 'high blood pressure', 'HTN', 'headache', 'elevated BP'],
  },
  {
    code: 'I20.9',
    description: 'Angina pectoris, unspecified',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['angina', 'chest pain', 'ischaemia', 'stable angina', 'chest tightness'],
  },
  {
    code: 'I21.9',
    description: 'Acute myocardial infarction, unspecified (Heart Attack)',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['heart attack', 'MI', 'myocardial infarction', 'STEMI', 'chest pain', 'troponin'],
  },
  {
    code: 'I25.9',
    description: 'Chronic ischaemic heart disease, unspecified',
    category: 'Cardiovascular',
    saPrevalence: 'Common',
    keywords: ['IHD', 'ischaemic heart disease', 'coronary artery disease', 'chest pain', 'angina'],
  },
  {
    code: 'I42.0',
    description: 'Dilated cardiomyopathy',
    category: 'Cardiovascular',
    saPrevalence: 'Common',
    keywords: ['dilated cardiomyopathy', 'DCM', 'heart failure', 'HIV cardiomyopathy', 'peripartum'],
  },
  {
    code: 'I48.9',
    description: 'Atrial fibrillation and flutter, unspecified',
    category: 'Cardiovascular',
    saPrevalence: 'Common',
    keywords: ['atrial fibrillation', 'AF', 'AFib', 'irregular pulse', 'palpitations', 'stroke risk'],
  },
  {
    code: 'I50.9',
    description: 'Heart failure, unspecified',
    category: 'Cardiovascular',
    saPrevalence: 'Very Common',
    keywords: ['heart failure', 'cardiac failure', 'breathlessness', 'oedema', 'CCF', 'pulmonary oedema'],
  },
  {
    code: 'I61.9',
    description: 'Intracerebral haemorrhage, unspecified',
    category: 'Neurological',
    saPrevalence: 'Common',
    keywords: ['intracerebral haemorrhage', 'haemorrhagic stroke', 'ICH', 'sudden headache', 'hypertension'],
  },
  {
    code: 'I63.9',
    description: 'Cerebral infarction, unspecified (Ischaemic Stroke)',
    category: 'Neurological',
    saPrevalence: 'Very Common',
    keywords: ['stroke', 'ischaemic stroke', 'CVA', 'facial droop', 'arm weakness', 'FAST'],
  },
  {
    code: 'I64',
    description: 'Stroke, not specified as haemorrhage or infarction',
    category: 'Neurological',
    saPrevalence: 'Very Common',
    keywords: ['stroke', 'CVA', 'cerebrovascular accident', 'weakness', 'speech problems'],
  },
  {
    code: 'I83.9',
    description: 'Varicose veins of lower extremities without ulcer or inflammation',
    category: 'Vascular',
    saPrevalence: 'Very Common',
    keywords: ['varicose veins', 'leg veins', 'venous insufficiency', 'oedema'],
  },
  {
    code: 'I84.9',
    description: 'Unspecified haemorrhoids without complication',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['haemorrhoids', 'piles', 'rectal bleeding', 'anal pain', 'prolapse'],
  },

  // ============================================================
  // RESPIRATORY SYSTEM (J00-J99)
  // ============================================================
  {
    code: 'J00',
    description: 'Acute nasopharyngitis [common cold]',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['common cold', 'URTI', 'runny nose', 'sneezing', 'rhinitis', 'viral'],
  },
  {
    code: 'J02.9',
    description: 'Acute pharyngitis, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['pharyngitis', 'sore throat', 'tonsillitis', 'throat pain'],
  },
  {
    code: 'J06.9',
    description: 'Acute upper respiratory infection, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['URTI', 'upper respiratory infection', 'cold', 'flu-like illness'],
  },
  {
    code: 'J11.1',
    description: 'Influenza with other respiratory manifestations, virus not identified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['influenza', 'flu', 'fever', 'myalgia', 'cough', 'headache'],
  },
  {
    code: 'J18.9',
    description: 'Pneumonia, unspecified organism',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['pneumonia', 'CAP', 'chest infection', 'consolidation', 'productive cough', 'fever'],
  },
  {
    code: 'J20.9',
    description: 'Acute bronchitis, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['bronchitis', 'acute bronchitis', 'cough', 'chest tightness', 'productive cough'],
  },
  {
    code: 'J22',
    description: 'Unspecified acute lower respiratory infection',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['LRTI', 'lower respiratory infection', 'chest infection', 'cough', 'wheeze'],
  },
  {
    code: 'J30.9',
    description: 'Allergic rhinitis, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['allergic rhinitis', 'hay fever', 'sneezing', 'runny nose', 'nasal congestion'],
  },
  {
    code: 'J32.9',
    description: 'Chronic sinusitis, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['sinusitis', 'chronic sinusitis', 'facial pain', 'nasal discharge', 'blocked nose'],
  },
  {
    code: 'J44.1',
    description: 'Chronic obstructive pulmonary disease with acute exacerbation',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['COPD', 'chronic bronchitis', 'emphysema', 'exacerbation', 'dyspnoea', 'smoking'],
  },
  {
    code: 'J45.9',
    description: 'Asthma, unspecified',
    category: 'Respiratory',
    saPrevalence: 'Very Common',
    keywords: ['asthma', 'wheeze', 'bronchospasm', 'dyspnoea', 'chest tightness', 'bronchial asthma'],
  },

  // ============================================================
  // DIGESTIVE SYSTEM (K00-K99)
  // ============================================================
  {
    code: 'K21.0',
    description: 'Gastro-oesophageal reflux disease with oesophagitis',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['GERD', 'acid reflux', 'heartburn', 'oesophagitis', 'regurgitation'],
  },
  {
    code: 'K25.9',
    description: 'Gastric ulcer, unspecified',
    category: 'Gastrointestinal',
    saPrevalence: 'Common',
    keywords: ['gastric ulcer', 'peptic ulcer', 'stomach ulcer', 'epigastric pain', 'haematemesis'],
  },
  {
    code: 'K29.7',
    description: 'Gastritis, unspecified',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['gastritis', 'stomach inflammation', 'epigastric pain', 'H. pylori', 'nausea'],
  },
  {
    code: 'K35.9',
    description: 'Acute appendicitis without abscess',
    category: 'Surgical',
    saPrevalence: 'Common',
    keywords: ['appendicitis', 'RIF pain', 'McBurney point', 'rebound tenderness', 'surgical abdomen'],
  },
  {
    code: 'K40.9',
    description: 'Unilateral inguinal hernia without obstruction or gangrene',
    category: 'Surgical',
    saPrevalence: 'Very Common',
    keywords: ['inguinal hernia', 'groin swelling', 'hernia', 'reducible'],
  },
  {
    code: 'K57.9',
    description: 'Diverticular disease of intestine, part unspecified, without perforation or abscess',
    category: 'Gastrointestinal',
    saPrevalence: 'Common',
    keywords: ['diverticular disease', 'diverticulitis', 'left lower abdominal pain', 'constipation'],
  },
  {
    code: 'K58.9',
    description: 'Irritable bowel syndrome without diarrhoea (IBS)',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['IBS', 'irritable bowel', 'abdominal cramps', 'bloating', 'alternating bowel'],
  },
  {
    code: 'K70.9',
    description: 'Alcoholic liver disease, unspecified',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['alcoholic liver disease', 'alcoholic hepatitis', 'cirrhosis', 'ascites', 'alcohol'],
  },
  {
    code: 'K74.6',
    description: 'Other and unspecified cirrhosis of liver',
    category: 'Gastrointestinal',
    saPrevalence: 'Very Common',
    keywords: ['cirrhosis', 'liver cirrhosis', 'ascites', 'jaundice', 'portal hypertension', 'hepatic'],
  },
  {
    code: 'K80.2',
    description: 'Calculus of gallbladder without cholecystitis',
    category: 'Surgical',
    saPrevalence: 'Common',
    keywords: ['gallstones', 'cholelithiasis', 'biliary colic', 'right upper quadrant pain', 'fatty food'],
  },
  {
    code: 'K85.9',
    description: 'Acute pancreatitis, unspecified',
    category: 'Gastrointestinal',
    saPrevalence: 'Common',
    keywords: ['pancreatitis', 'epigastric pain', 'amylase', 'lipase', 'gallstones', 'alcohol'],
  },

  // ============================================================
  // SKIN AND SUBCUTANEOUS (L00-L99)
  // ============================================================
  {
    code: 'L01.0',
    description: 'Impetigo [any organism] [any site]',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['impetigo', 'skin infection', 'golden crusting', 'staphylococcal', 'streptococcal'],
  },
  {
    code: 'L02.9',
    description: 'Cutaneous abscess, furuncle and carbuncle, unspecified',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['abscess', 'boil', 'furuncle', 'carbuncle', 'staph', 'skin boil'],
  },
  {
    code: 'L03.9',
    description: 'Cellulitis, unspecified',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['cellulitis', 'skin infection', 'redness', 'swelling', 'warmth', 'erythema'],
  },
  {
    code: 'L20.9',
    description: 'Atopic dermatitis, unspecified (Eczema)',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['eczema', 'atopic dermatitis', 'itching', 'dry skin', 'rash', 'atopy'],
  },
  {
    code: 'L23.9',
    description: 'Allergic contact dermatitis, unspecified cause',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['contact dermatitis', 'allergic rash', 'skin allergy', 'itching', 'redness'],
  },
  {
    code: 'L29.9',
    description: 'Pruritus, unspecified (Itch)',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['pruritus', 'itching', 'itch', 'generalised itch', 'pruritis'],
  },
  {
    code: 'L40.0',
    description: 'Psoriasis vulgaris',
    category: 'Dermatology',
    saPrevalence: 'Common',
    keywords: ['psoriasis', 'silvery plaques', 'scaling', 'erythematous plaques', 'psoriatic arthritis'],
  },
  {
    code: 'L50.9',
    description: 'Urticaria, unspecified (Hives)',
    category: 'Dermatology',
    saPrevalence: 'Very Common',
    keywords: ['urticaria', 'hives', 'wheals', 'allergic reaction', 'itching', 'swelling'],
  },

  // ============================================================
  // MUSCULOSKELETAL (M00-M99)
  // ============================================================
  {
    code: 'M05.9',
    description: 'Seropositive rheumatoid arthritis, unspecified',
    category: 'Musculoskeletal',
    saPrevalence: 'Common',
    keywords: ['rheumatoid arthritis', 'RA', 'joint pain', 'morning stiffness', 'synovitis'],
  },
  {
    code: 'M10.9',
    description: 'Gout, unspecified',
    category: 'Musculoskeletal',
    saPrevalence: 'Common',
    keywords: ['gout', 'uric acid', 'podagra', 'big toe', 'monoarthritis', 'tophi'],
  },
  {
    code: 'M15.9',
    description: 'Polyarthrosis, unspecified (Osteoarthritis)',
    category: 'Musculoskeletal',
    saPrevalence: 'Very Common',
    keywords: ['osteoarthritis', 'joint pain', 'crepitus', 'knee pain', 'hip pain', 'DJD'],
  },
  {
    code: 'M17.9',
    description: 'Gonarthrosis (knee osteoarthritis), unspecified',
    category: 'Musculoskeletal',
    saPrevalence: 'Very Common',
    keywords: ['knee osteoarthritis', 'knee pain', 'crepitus', 'gonarthrosis', 'knee effusion'],
  },
  {
    code: 'M48.9',
    description: 'Spondylopathy, unspecified',
    category: 'Musculoskeletal',
    saPrevalence: 'Common',
    keywords: ['spondylosis', 'spine disease', 'back pain', 'cervical spondylosis', 'lumbar spondylosis'],
  },
  {
    code: 'M54.5',
    description: 'Low back pain',
    category: 'Musculoskeletal',
    saPrevalence: 'Very Common',
    keywords: ['back pain', 'LBP', 'lumbar pain', 'backache', 'non-specific back pain'],
  },
  {
    code: 'M75.1',
    description: 'Rotator cuff syndrome',
    category: 'Musculoskeletal',
    saPrevalence: 'Very Common',
    keywords: ['rotator cuff', 'shoulder pain', 'supraspinatus', 'shoulder impingement'],
  },
  {
    code: 'M79.3',
    description: 'Panniculitis, unspecified (Musculoskeletal pain)',
    category: 'Musculoskeletal',
    saPrevalence: 'Very Common',
    keywords: ['myalgia', 'muscle pain', 'panniculitis', 'soft tissue pain', 'fibromyalgia'],
  },

  // ============================================================
  // GENITOURINARY SYSTEM (N00-N99)
  // ============================================================
  {
    code: 'N10',
    description: 'Acute pyelonephritis',
    category: 'Renal',
    saPrevalence: 'Very Common',
    keywords: ['pyelonephritis', 'kidney infection', 'loin pain', 'fever', 'UTI', 'costovertebral angle'],
  },
  {
    code: 'N18.9',
    description: 'Chronic kidney disease, unspecified',
    category: 'Renal',
    saPrevalence: 'Very Common',
    keywords: ['CKD', 'chronic kidney disease', 'renal failure', 'creatinine', 'proteinuria'],
  },
  {
    code: 'N20.0',
    description: 'Calculus of kidney (Renal stone/Nephrolithiasis)',
    category: 'Renal',
    saPrevalence: 'Very Common',
    keywords: ['kidney stone', 'renal calculus', 'loin pain', 'haematuria', 'colic'],
  },
  {
    code: 'N30.0',
    description: 'Acute cystitis',
    category: 'Renal',
    saPrevalence: 'Very Common',
    keywords: ['cystitis', 'UTI', 'urinary tract infection', 'dysuria', 'frequency', 'haematuria'],
  },
  {
    code: 'N39.0',
    description: 'Urinary tract infection, site not specified',
    category: 'Renal',
    saPrevalence: 'Very Common',
    keywords: ['UTI', 'urinary tract infection', 'burning urination', 'frequency', 'dysuria'],
  },
  {
    code: 'N40',
    description: 'Hyperplasia of prostate (BPH)',
    category: 'Urology',
    saPrevalence: 'Very Common',
    keywords: ['BPH', 'benign prostatic hyperplasia', 'urinary retention', 'hesitancy', 'nocturia'],
  },
  {
    code: 'N76.0',
    description: 'Acute vaginitis (Vulvovaginitis)',
    category: "Women's Health",
    saPrevalence: 'Very Common',
    keywords: ['vaginitis', 'vulvovaginitis', 'vaginal discharge', 'itching', 'BV', 'candida'],
  },
  {
    code: 'N91.2',
    description: 'Amenorrhoea, unspecified — secondary',
    category: "Women's Health",
    saPrevalence: 'Common',
    keywords: ['amenorrhoea', 'missed periods', 'no periods', 'secondary amenorrhoea', 'PCOS', 'pregnancy'],
  },
  {
    code: 'N92.6',
    description: 'Irregular menstruation, unspecified',
    category: "Women's Health",
    saPrevalence: 'Very Common',
    keywords: ['menstrual irregularity', 'irregular periods', 'heavy periods', 'menorrhagia'],
  },
  {
    code: 'N94.6',
    description: 'Dysmenorrhoea, unspecified',
    category: "Women's Health",
    saPrevalence: 'Very Common',
    keywords: ['dysmenorrhoea', 'period pain', 'menstrual cramps', 'pelvic pain'],
  },

  // ============================================================
  // PREGNANCY, CHILDBIRTH AND PUERPERIUM (O00-O99)
  // ============================================================
  {
    code: 'O10.0',
    description: 'Pre-existing essential hypertension complicating pregnancy, childbirth and puerperium',
    category: 'Obstetrics',
    saPrevalence: 'Very Common',
    keywords: ['hypertension in pregnancy', 'chronic hypertension', 'pre-existing HTN', 'obstetric'],
  },
  {
    code: 'O14.1',
    description: 'Severe pre-eclampsia',
    category: 'Obstetrics',
    saPrevalence: 'Very Common',
    keywords: ['pre-eclampsia', 'PIH', 'hypertension pregnancy', 'proteinuria', 'oedema', 'headache'],
  },
  {
    code: 'O15.0',
    description: 'Eclampsia in pregnancy',
    category: 'Obstetrics',
    saPrevalence: 'Common',
    keywords: ['eclampsia', 'seizure in pregnancy', 'convulsion', 'magnesium sulphate'],
  },
  {
    code: 'O20.0',
    description: 'Threatened abortion (Threatened miscarriage)',
    category: 'Obstetrics',
    saPrevalence: 'Common',
    keywords: ['threatened miscarriage', 'vaginal bleeding in pregnancy', 'threatened abortion', 'first trimester bleeding'],
  },
  {
    code: 'O70.0',
    description: 'First degree perineal laceration during delivery',
    category: 'Obstetrics',
    saPrevalence: 'Common',
    keywords: ['perineal tear', 'laceration', 'delivery', 'episiotomy', 'repair'],
  },
  {
    code: 'O90.4',
    description: 'Postpartum acute renal failure',
    category: 'Obstetrics',
    saPrevalence: 'Common',
    keywords: ['postpartum', 'renal failure', 'AKI', 'postnatal complication'],
  },

  // ============================================================
  // PAEDIATRIC CONDITIONS (specific)
  // ============================================================
  {
    code: 'P07.3',
    description: 'Other preterm infants (Prematurity)',
    category: 'Paediatrics',
    saPrevalence: 'Very Common',
    keywords: ['premature', 'preterm', 'low birth weight', 'NICU', 'prematurity'],
  },
  {
    code: 'P36.9',
    description: 'Bacterial sepsis of newborn, unspecified (Neonatal sepsis)',
    category: 'Paediatrics',
    saPrevalence: 'Very Common',
    keywords: ['neonatal sepsis', 'newborn infection', 'fever neonate', 'group B strep'],
  },

  // ============================================================
  // INJURY AND POISONING (S00-T98)
  // ============================================================
  {
    code: 'S09.9',
    description: 'Unspecified injury of head',
    category: 'Emergency/Trauma',
    saPrevalence: 'Very Common',
    keywords: ['head injury', 'head trauma', 'TBI', 'concussion', 'skull fracture'],
  },
  {
    code: 'S72.9',
    description: 'Fracture of femur, unspecified',
    category: 'Emergency/Trauma',
    saPrevalence: 'Common',
    keywords: ['femur fracture', 'hip fracture', 'broken leg', 'MVA', 'elderly fall'],
  },
  {
    code: 'T14.9',
    description: 'Injury, unspecified',
    category: 'Emergency/Trauma',
    saPrevalence: 'Very Common',
    keywords: ['trauma', 'injury', 'wound', 'MVA', 'violence', 'GSW'],
  },
  {
    code: 'T39.1',
    description: '4-Aminophenol derivatives (Paracetamol) poisoning',
    category: 'Emergency/Toxicology',
    saPrevalence: 'Very Common',
    keywords: ['paracetamol overdose', 'panadol overdose', 'poisoning', 'hepatotoxicity'],
  },
  {
    code: 'T65.9',
    description: 'Toxic effects of unspecified substance',
    category: 'Emergency/Toxicology',
    saPrevalence: 'Very Common',
    keywords: ['poisoning', 'toxic exposure', 'organophosphate', 'nyaope', 'overdose'],
  },

  // ============================================================
  // SYMPTOMS AND SIGNS (R00-R99)
  // ============================================================
  {
    code: 'R00.0',
    description: 'Tachycardia, unspecified',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['fast heart rate', 'tachycardia', 'palpitations', 'racing heart'],
  },
  {
    code: 'R05',
    description: 'Cough',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['cough', 'productive cough', 'dry cough', 'chronic cough'],
  },
  {
    code: 'R06.0',
    description: 'Dyspnoea',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['shortness of breath', 'dyspnoea', 'breathlessness', 'breathlessness on exertion'],
  },
  {
    code: 'R07.4',
    description: 'Chest pain, unspecified',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['chest pain', 'chest tightness', 'thoracic pain', 'non-specific chest pain'],
  },
  {
    code: 'R10.4',
    description: 'Other and unspecified abdominal pain',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['abdominal pain', 'stomach pain', 'tummy pain', 'belly ache'],
  },
  {
    code: 'R11',
    description: 'Nausea and vomiting',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['nausea', 'vomiting', 'nausea and vomiting', 'emesis'],
  },
  {
    code: 'R17',
    description: 'Unspecified jaundice',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['jaundice', 'yellow skin', 'yellow eyes', 'icterus', 'bilirubin'],
  },
  {
    code: 'R50.9',
    description: 'Fever, unspecified',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['fever', 'pyrexia', 'high temperature', 'febrile', 'pyrexia of unknown origin'],
  },
  {
    code: 'R51',
    description: 'Headache',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['headache', 'cephalalgia', 'head pain', 'migraine', 'tension headache'],
  },
  {
    code: 'R53',
    description: 'Malaise and fatigue',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['fatigue', 'tiredness', 'weakness', 'malaise', 'lassitude', 'lethargy'],
  },
  {
    code: 'R55',
    description: 'Syncope and collapse',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['syncope', 'fainting', 'blackout', 'collapse', 'loss of consciousness'],
  },
  {
    code: 'R60.0',
    description: 'Localised oedema',
    category: 'Symptoms',
    saPrevalence: 'Very Common',
    keywords: ['oedema', 'swelling', 'ankle oedema', 'pitting oedema', 'fluid retention'],
  },

  // ============================================================
  // FACTORS INFLUENCING HEALTH (Z00-Z99)
  // ============================================================
  {
    code: 'Z21',
    description: 'Asymptomatic human immunodeficiency virus [HIV] infection status',
    category: 'HIV/AIDS',
    saPrevalence: 'Very Common',
    keywords: ['HIV positive', 'asymptomatic HIV', 'HIV status', 'HIV monitoring'],
  },
  {
    code: 'Z34.9',
    description: 'Supervision of normal pregnancy, unspecified',
    category: 'Obstetrics',
    saPrevalence: 'Very Common',
    keywords: ['antenatal care', 'ANC', 'pregnancy', 'prenatal visit', 'routine pregnancy'],
  },
  {
    code: 'Z76.0',
    description: 'Issue of repeat prescription',
    category: 'Administrative',
    saPrevalence: 'Very Common',
    keywords: ['repeat prescription', 'chronic medication', 'refill', 'script renewal'],
  },
];

/**
 * Search ICD-10 codes by keyword, description, or code
 */
export function searchICD10Codes(query: string, limit = 20): ICD10Code[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results = ICD10_COMMON_CODES.filter((code) => {
    return (
      code.code.toLowerCase().includes(q) ||
      code.description.toLowerCase().includes(q) ||
      code.category.toLowerCase().includes(q) ||
      code.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  // Sort: exact code match first, then keyword match, then description
  results.sort((a, b) => {
    const aExact = a.code.toLowerCase() === q ? 0 : 1;
    const bExact = b.code.toLowerCase() === q ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;

    const aKeyword = a.keywords.some((kw) => kw.toLowerCase() === q) ? 0 : 1;
    const bKeyword = b.keywords.some((kw) => kw.toLowerCase() === q) ? 0 : 1;
    return aKeyword - bKeyword;
  });

  return results.slice(0, limit);
}

/**
 * Get ICD-10 code by exact code string
 */
export function getICD10ByCode(code: string): ICD10Code | undefined {
  return ICD10_COMMON_CODES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

/**
 * Get ICD-10 codes by category
 */
export function getICD10ByCategory(category: string): ICD10Code[] {
  return ICD10_COMMON_CODES.filter((c) => c.category.toLowerCase() === category.toLowerCase());
}
