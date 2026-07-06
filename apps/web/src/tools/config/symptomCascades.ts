import type { DeptId } from './departments';

// ─── Symptom cascades ────────────────────────────────────────────────────────
// ZERO-TYPING history intake: the intern taps a presenting complaint chip and
// answers a short cascade of structured blocks (single-select, multi-select,
// toggles). Selections serialize to clinical shorthand text that is written
// into the SAME string fields the AI endpoints already consume — blocks are an
// input method, not a new data model. Free text always has the EscapeHatch.

export interface CascadeOption {
  id: string;
  label: string;
  /** Blocks that appear only when this option is selected. */
  followUps?: CascadeBlock[];
}

export interface CascadeBlock {
  id: string;
  question: string;
  kind: 'single' | 'multi' | 'toggle';
  options: CascadeOption[];
  /** Teaching rationale, shown behind a WhyButton where non-obvious. */
  why?: string;
  /** Only shown for female patients (e.g. gynae screen in abdo pain). */
  femaleOnly?: boolean;
}

export interface SymptomCascade {
  id: string;
  label: string;
  icon?: string;
  /** Restrict the chip to these departments; omit = shown everywhere. */
  depts?: DeptId[];
  blocks: CascadeBlock[];
}

/** blockId → selected option ids (single: length ≤1; multi/toggle: any). */
export type CascadeSelections = Record<string, string[]>;

// ── Helpers ──────────────────────────────────────────────────────────────────

function opt(id: string, label: string, followUps?: CascadeBlock[]): CascadeOption {
  return { id, label, followUps };
}

/** Walk the blocks that are currently visible given the selections (base
 *  blocks + followUps of selected options, depth-first, in reading order). */
export function visibleBlocks(cascade: SymptomCascade, selections: CascadeSelections, isFemale: boolean): CascadeBlock[] {
  const out: CascadeBlock[] = [];
  const walk = (blocks: CascadeBlock[]) => {
    for (const b of blocks) {
      if (b.femaleOnly && !isFemale) continue;
      out.push(b);
      const chosen = selections[b.id] ?? [];
      for (const o of b.options) {
        if (o.followUps && chosen.includes(o.id)) walk(o.followUps);
      }
    }
  };
  walk(cascade.blocks);
  return out;
}

/** Serialize the answered blocks to clinical shorthand, e.g.
 *  "Chest pain: crushing, radiating L arm + jaw, assoc diaphoresis+nausea, onset 2h, at rest". */
export function serializeCascade(cascade: SymptomCascade, selections: CascadeSelections, customNote?: string): string {
  const parts: string[] = [];
  const walk = (blocks: CascadeBlock[]) => {
    for (const b of blocks) {
      const chosen = (selections[b.id] ?? [])
        .map(id => b.options.find(o => o.id === id))
        .filter((o): o is CascadeOption => Boolean(o));
      if (chosen.length > 0) parts.push(chosen.map(o => o.label).join(' + '));
      for (const o of b.options) {
        if (o.followUps && (selections[b.id] ?? []).includes(o.id)) walk(o.followUps);
      }
    }
  };
  walk(cascade.blocks);
  if (customNote?.trim()) parts.push(customNote.trim());
  if (parts.length === 0) return cascade.label;
  return `${cascade.label}: ${parts.join(', ')}`;
}

export function cascadesFor(dept: DeptId): SymptomCascade[] {
  return SYMPTOM_CASCADES.filter(c => !c.depts || c.depts.includes(dept));
}

// ── Registry ─────────────────────────────────────────────────────────────────

export const SYMPTOM_CASCADES: SymptomCascade[] = [
  {
    id: 'chest-pain',
    label: 'Chest pain',
    icon: '❤️',
    depts: ['medicine', 'emergency', 'icu', 'surgery'],
    blocks: [
      {
        id: 'cp-character',
        question: 'Character of the pain?',
        kind: 'single',
        why: 'Character splits the big three: crushing → ACS, tearing → dissection, pleuritic → PE/pneumonia/pneumothorax.',
        options: [
          opt('crushing', 'crushing/pressure'),
          opt('pleuritic', 'pleuritic (worse on inspiration)'),
          opt('tearing', 'tearing, radiating to back'),
          opt('burning', 'burning/retrosternal'),
          opt('stabbing', 'sharp/stabbing'),
        ],
      },
      {
        id: 'cp-radiation',
        question: 'Radiation?',
        kind: 'multi',
        options: [
          opt('l-arm', 'radiating L arm'),
          opt('jaw', 'radiating jaw'),
          opt('back', 'radiating to back'),
          opt('epigastric', 'radiating epigastrium'),
          opt('none-rad', 'no radiation'),
        ],
      },
      {
        id: 'cp-autonomic',
        question: 'Associated symptoms?',
        kind: 'multi',
        why: 'Autonomic features (diaphoresis, nausea, vomiting) raise the pre-test probability of ACS substantially.',
        options: [
          opt('diaphoresis', 'assoc diaphoresis'),
          opt('nausea', 'assoc nausea'),
          opt('vomiting', 'assoc vomiting'),
          opt('sob', 'assoc SOB'),
          opt('palpitations', 'assoc palpitations'),
          opt('syncope', 'assoc syncope'),
        ],
      },
      {
        id: 'cp-onset',
        question: 'Onset / duration?',
        kind: 'single',
        options: [
          opt('lt1h', 'onset <1h'),
          opt('2h', 'onset ~2h'),
          opt('hrs', 'onset several hours'),
          opt('days', 'ongoing days'),
          opt('intermittent', 'intermittent episodes'),
        ],
      },
      {
        id: 'cp-exertion',
        question: 'Setting?',
        kind: 'single',
        why: 'Pain at rest lasting >20 min is an ACS red flag; exertional pain relieved by rest suggests stable angina.',
        options: [
          opt('rest', 'at rest'),
          opt('exertion', 'on exertion'),
          opt('post-exertion', 'after exertion, relieved by rest'),
        ],
      },
    ],
  },
  {
    id: 'sob',
    label: 'Shortness of breath',
    icon: '🫁',
    depts: ['medicine', 'emergency', 'icu', 'paeds'],
    blocks: [
      {
        id: 'sob-onset',
        question: 'Onset?',
        kind: 'single',
        why: 'Sudden SOB → PE/pneumothorax; hours-days → pneumonia/pulmonary oedema; weeks → effusion, TB, anaemia, cardiac failure.',
        options: [
          opt('sudden', 'sudden onset'),
          opt('hours', 'over hours'),
          opt('days', 'over days'),
          opt('weeks', 'progressive over weeks'),
        ],
      },
      {
        id: 'sob-cardiac',
        question: 'Cardiac screen',
        kind: 'toggle',
        why: 'Orthopnoea and PND are the most specific bedside pointers to left heart failure.',
        options: [
          opt('orthopnoea', 'orthopnoea'),
          opt('pnd', 'PND'),
          opt('leg-swelling', 'leg swelling'),
        ],
      },
      {
        id: 'sob-noise',
        question: 'Noisy breathing?',
        kind: 'single',
        why: 'Wheeze is expiratory/lower airway; stridor is inspiratory/upper airway and an airway emergency.',
        options: [
          opt('wheeze', 'wheeze'),
          opt('stridor', 'STRIDOR'),
          opt('none', 'no added noise'),
        ],
      },
      {
        id: 'sob-cough',
        question: 'Cough / sputum?',
        kind: 'multi',
        options: [
          opt('dry', 'dry cough'),
          opt('productive', 'productive cough', [
            {
              id: 'sob-sputum',
              question: 'Sputum?',
              kind: 'single',
              options: [
                opt('purulent', 'purulent sputum'),
                opt('pink-frothy', 'pink frothy sputum'),
                opt('haemoptysis', 'haemoptysis'),
              ],
            },
          ]),
          opt('no-cough', 'no cough'),
        ],
      },
      {
        id: 'sob-assoc',
        question: 'Associated?',
        kind: 'multi',
        options: [
          opt('chest-pain', 'assoc chest pain'),
          opt('fever', 'assoc fever'),
          opt('night-sweats', 'night sweats/weight loss'),
        ],
      },
    ],
  },
  {
    id: 'abdo-pain',
    label: 'Abdominal pain',
    icon: '🫃',
    depts: ['medicine', 'surgery', 'emergency', 'og', 'paeds'],
    blocks: [
      {
        id: 'abdo-site',
        question: 'Site? (9 regions)',
        kind: 'single',
        why: 'Region anchors the differential: RUQ → biliary; epigastric → PUD/pancreatitis; RIF → appendix/ectopic; suprapubic → urinary/uterine.',
        options: [
          opt('ruq', 'RUQ'),
          opt('epigastric', 'epigastric'),
          opt('luq', 'LUQ'),
          opt('r-flank', 'R flank'),
          opt('periumbilical', 'periumbilical'),
          opt('l-flank', 'L flank'),
          opt('rif', 'RIF'),
          opt('suprapubic', 'suprapubic'),
          opt('lif', 'LIF'),
        ],
      },
      {
        id: 'abdo-character',
        question: 'Character?',
        kind: 'single',
        options: [
          opt('colicky', 'colicky'),
          opt('constant', 'constant'),
          opt('burning', 'burning'),
          opt('cramping', 'cramping'),
        ],
      },
      {
        id: 'abdo-onset',
        question: 'Onset & course?',
        kind: 'single',
        options: [
          opt('sudden', 'sudden onset'),
          opt('gradual', 'gradual onset'),
          opt('migrating', 'started periumbilical, migrated RIF'),
        ],
      },
      {
        id: 'abdo-gi',
        question: 'GI upset?',
        kind: 'multi',
        options: [
          opt('nausea', 'nausea'),
          opt('vomiting', 'vomiting'),
          opt('diarrhoea', 'diarrhoea'),
          opt('constipation', 'constipation/obstipation'),
          opt('anorexia', 'anorexia'),
          opt('distension', 'distension'),
        ],
      },
      {
        id: 'abdo-severity',
        question: 'Severity / aggravation?',
        kind: 'multi',
        options: [
          opt('worst-movement', 'worse on movement (peritonism)'),
          opt('eating', 'related to eating'),
          opt('severe', 'severe 8-10/10'),
          opt('mild-mod', 'mild-moderate'),
        ],
      },
      {
        id: 'abdo-gynae',
        question: 'Gynae screen',
        kind: 'toggle',
        femaleOnly: true,
        why: 'Every woman of childbearing age with abdominal pain has an ectopic until proven otherwise — LMP and PV symptoms are not optional.',
        options: [
          opt('lmp-overdue', 'LMP overdue/possible pregnancy'),
          opt('pv-bleed', 'PV bleeding'),
          opt('pv-discharge', 'PV discharge'),
          opt('dyspareunia', 'dyspareunia'),
        ],
      },
    ],
  },
  {
    id: 'headache',
    label: 'Headache',
    icon: '🤕',
    depts: ['medicine', 'emergency', 'og'],
    blocks: [
      {
        id: 'ha-thunderclap',
        question: 'Thunderclap onset (maximal <1 min)?',
        kind: 'toggle',
        why: 'Thunderclap headache is SAH until excluded — this single question changes the whole pathway, so it comes first.',
        options: [opt('thunderclap', 'THUNDERCLAP onset')],
      },
      {
        id: 'ha-redflags',
        question: 'Red flags',
        kind: 'multi',
        why: 'Worst-ever, meningism, fever or new focal deficit each mandates urgent imaging ± LP; a normal pattern headache does not.',
        options: [
          opt('worst-ever', 'worst headache ever'),
          opt('neck-stiff', 'neck stiffness'),
          opt('visual', 'visual disturbance'),
          opt('fever', 'fever'),
          opt('focal', 'focal weakness/numbness'),
          opt('woke', 'wakes from sleep/worse lying flat'),
          opt('none', 'no red flags'),
        ],
      },
      {
        id: 'ha-aura',
        question: 'Aura?',
        kind: 'single',
        options: [
          opt('visual-aura', 'visual aura'),
          opt('sensory-aura', 'sensory aura'),
          opt('no-aura', 'no aura'),
        ],
      },
      {
        id: 'ha-pattern',
        question: 'Pattern?',
        kind: 'single',
        options: [
          opt('first', 'first ever'),
          opt('known-same', 'known headaches, same pattern'),
          opt('known-changed', 'known headaches, CHANGED pattern'),
        ],
      },
      {
        id: 'ha-duration',
        question: 'Duration?',
        kind: 'single',
        options: [
          opt('lt24h', '<24h'),
          opt('days', 'days'),
          opt('weeks', 'weeks, progressive'),
        ],
      },
    ],
  },
  {
    id: 'fever',
    label: 'Fever',
    icon: '🌡️',
    depts: ['medicine', 'emergency', 'paeds', 'icu', 'og', 'surgery'],
    blocks: [
      {
        id: 'fev-duration',
        question: 'Duration?',
        kind: 'single',
        options: [
          opt('lt48h', '<48h'),
          opt('2-7d', '2-7 days'),
          opt('gt7d', '>7 days'),
          opt('gt2w', '>2 weeks (chronic)'),
        ],
      },
      {
        id: 'fev-localizing',
        question: 'Localizing symptoms?',
        kind: 'multi',
        why: 'The source hunt: urinary, respiratory, GI, skin/soft tissue and CNS cover most admissions — "no localizing symptoms" is itself an important finding.',
        options: [
          opt('urinary', 'urinary (dysuria/frequency)'),
          opt('resp', 'respiratory (cough/SOB)'),
          opt('gi', 'GI (diarrhoea/abdo pain)'),
          opt('skin', 'skin/soft tissue'),
          opt('cns', 'headache/confusion'),
          opt('joint', 'hot joint'),
          opt('none', 'no localizing symptoms'),
        ],
      },
      {
        id: 'fev-risk',
        question: 'Risk screen',
        kind: 'toggle',
        why: 'Malaria area travel, TB contact and HIV status redirect the entire septic screen in the SA context.',
        options: [
          opt('travel', 'recent travel/malaria area'),
          opt('tb-contact', 'TB contact'),
          opt('hiv', 'HIV positive/unknown'),
          opt('rigors', 'rigors'),
          opt('night-sweats', 'night sweats'),
        ],
      },
      {
        id: 'fev-immuno',
        question: 'Recently hospitalised / on chemo / neutropenic risk?',
        kind: 'toggle',
        options: [
          opt('recent-admission', 'recent hospital admission'),
          opt('chemo', 'on chemotherapy/immunosuppressed'),
        ],
      },
    ],
  },
  {
    id: 'trauma',
    label: 'Trauma / injury',
    icon: '🚑',
    depts: ['emergency', 'ortho', 'surgery'],
    blocks: [
      {
        id: 'tr-mechanism',
        question: 'Mechanism?',
        kind: 'single',
        why: 'Mechanism predicts occult injury — high-energy transfer (MVA, fall >3m) mandates a full trauma survey regardless of how the patient looks.',
        options: [
          opt('mva-occupant', 'MVA occupant'),
          opt('pva', 'pedestrian vehicle accident'),
          opt('fall-low', 'fall <2m / same level'),
          opt('fall-high', 'fall from height >2m'),
          opt('assault-blunt', 'assault — blunt'),
          opt('stab', 'stab wound'),
          opt('gsw', 'gunshot wound'),
        ],
      },
      {
        id: 'tr-loc',
        question: 'Loss of consciousness?',
        kind: 'single',
        options: [
          opt('loc-yes', '+LOC', [
            {
              id: 'tr-loc-dur',
              question: 'How long?',
              kind: 'single',
              options: [
                opt('sec', 'seconds'),
                opt('min', 'minutes'),
                opt('ongoing', 'still reduced LOC'),
              ],
            },
          ]),
          opt('loc-no', 'no LOC'),
          opt('loc-unknown', 'LOC unknown/unwitnessed'),
        ],
      },
      {
        id: 'tr-anticoag',
        question: 'On anticoagulation / antiplatelets?',
        kind: 'toggle',
        why: 'Warfarin/DOAC changes head-injury imaging thresholds and bleeding risk everywhere else.',
        options: [
          opt('anticoag', 'on anticoagulant'),
          opt('antiplatelet', 'on antiplatelet'),
        ],
      },
      {
        id: 'tr-symptoms',
        question: 'Since the injury?',
        kind: 'multi',
        options: [
          opt('vomiting', 'vomiting'),
          opt('amnesia', 'amnesia'),
          opt('seizure', 'seizure'),
          opt('neck-pain', 'neck pain'),
          opt('cant-weightbear', 'cannot weight-bear'),
        ],
      },
      {
        id: 'tr-etoh',
        question: 'Alcohol involved?',
        kind: 'single',
        options: [
          opt('etoh-yes', 'EtOH on board'),
          opt('etoh-no', 'no alcohol'),
        ],
      },
    ],
  },
  {
    id: 'pv-bleeding',
    label: 'PV bleeding',
    icon: '🩸',
    depts: ['og', 'emergency', 'surgery', 'medicine'],
    blocks: [
      {
        id: 'pv-pregnant',
        question: 'Pregnant / possibly pregnant?',
        kind: 'single',
        why: 'Bleeding + positive pregnancy test splits into ectopic/miscarriage (<20w) vs praevia/abruption (>20w) — completely different pathways.',
        options: [
          opt('preg-yes', 'pregnant', [
            {
              id: 'pv-gestation',
              question: 'Gestation?',
              kind: 'single',
              options: [
                opt('lt12', '<12 weeks'),
                opt('12-20', '12-20 weeks'),
                opt('gt20', '>20 weeks'),
                opt('unsure-dates', 'unsure of dates'),
              ],
            },
            {
              id: 'pv-tissue',
              question: 'Products/tissue passed?',
              kind: 'single',
              options: [
                opt('tissue-yes', 'tissue passed'),
                opt('tissue-no', 'no tissue passed'),
              ],
            },
          ]),
          opt('preg-maybe', 'possibly pregnant — test pending'),
          opt('preg-no', 'not pregnant'),
        ],
      },
      {
        id: 'pv-amount',
        question: 'Amount?',
        kind: 'single',
        options: [
          opt('spotting', 'spotting'),
          opt('like-period', 'like a period'),
          opt('heavy', 'heavy — pads/hour', undefined),
          opt('clots', 'heavy with clots'),
        ],
      },
      {
        id: 'pv-pain',
        question: 'Pain?',
        kind: 'single',
        why: 'Painless bleeding >20w = praevia until scan excludes it (NO PV exam); painful = abruption.',
        options: [
          opt('painless', 'painless'),
          opt('cramping', 'cramping pain'),
          opt('severe-const', 'severe constant pain'),
          opt('shoulder-tip', 'shoulder-tip pain'),
        ],
      },
      {
        id: 'pv-assoc',
        question: 'Associated?',
        kind: 'multi',
        options: [
          opt('dizzy', 'dizziness/syncope'),
          opt('fever', 'fever/offensive discharge'),
          opt('post-coital', 'post-coital'),
        ],
      },
    ],
  },
  {
    id: 'reduced-loc',
    label: 'Reduced LOC',
    icon: '😵',
    depts: ['emergency', 'medicine', 'icu', 'paeds'],
    blocks: [
      {
        id: 'loc-glucose',
        question: 'Glucose checked?',
        kind: 'single',
        why: 'Hypoglycaemia is the fastest reversible cause of coma — the glucose belongs before any other workup.',
        options: [
          opt('glu-normal', 'glucose checked — normal'),
          opt('glu-low', 'glucose LOW'),
          opt('glu-high', 'glucose HIGH'),
          opt('glu-not', 'glucose NOT yet checked'),
        ],
      },
      {
        id: 'loc-onset',
        question: 'Onset?',
        kind: 'single',
        options: [
          opt('sudden', 'sudden collapse'),
          opt('gradual', 'gradual over hours'),
          opt('fluctuating', 'fluctuating'),
          opt('found', 'found down, time unknown'),
        ],
      },
      {
        id: 'loc-seizure',
        question: 'Seizure activity?',
        kind: 'single',
        options: [
          opt('witnessed-sz', 'witnessed seizure'),
          opt('possible-sz', 'possible seizure (incontinence/tongue bite)'),
          opt('no-sz', 'no seizure activity'),
        ],
      },
      {
        id: 'loc-tox',
        question: 'Toxic/metabolic screen',
        kind: 'toggle',
        options: [
          opt('etoh', 'alcohol suspected'),
          opt('overdose', 'overdose possible/pills found'),
          opt('opioids', 'opioids possible (pinpoint pupils)'),
          opt('traditional-med', 'traditional medicine use'),
        ],
      },
      {
        id: 'loc-context',
        question: 'Context',
        kind: 'multi',
        options: [
          opt('head-injury', 'preceding head injury'),
          opt('fever', 'febrile'),
          opt('headache', 'preceding headache'),
          opt('diabetic', 'known diabetic'),
          opt('known-epileptic', 'known epileptic'),
        ],
      },
    ],
  },
  {
    id: 'seizure',
    label: 'Seizure',
    icon: '⚡',
    depts: ['emergency', 'medicine', 'paeds', 'icu', 'og'],
    blocks: [
      {
        id: 'sz-first',
        question: 'First seizure or known epilepsy?',
        kind: 'single',
        why: 'A first seizure in an adult needs full workup (glucose, sodium, CT, ± LP); breakthrough in known epilepsy is usually adherence/levels.',
        options: [
          opt('first', 'FIRST seizure'),
          opt('known', 'known epilepsy', [
            {
              id: 'sz-adherence',
              question: 'Medication adherence?',
              kind: 'single',
              options: [
                opt('adherent', 'adherent to AEDs'),
                opt('missed', 'missed doses'),
                opt('ran-out', 'ran out of medication'),
              ],
            },
          ]),
        ],
      },
      {
        id: 'sz-duration',
        question: 'Duration?',
        kind: 'single',
        options: [
          opt('lt5', '<5 min, self-terminated'),
          opt('gt5', '>5 min'),
          opt('ongoing', 'ONGOING/recurring without recovery'),
        ],
      },
      {
        id: 'sz-focal',
        question: 'Onset type?',
        kind: 'single',
        why: 'Focal onset (one limb/face, head turning) points to a structural lesion and lowers the imaging threshold.',
        options: [
          opt('generalized', 'generalized from onset'),
          opt('focal', 'focal onset → generalized'),
          opt('focal-only', 'focal only, aware'),
          opt('unwitnessed', 'unwitnessed'),
        ],
      },
      {
        id: 'sz-postictal',
        question: 'Post-ictal state?',
        kind: 'single',
        options: [
          opt('recovered', 'fully recovered'),
          opt('drowsy', 'still drowsy/confused'),
          opt('todds', 'focal weakness (Todd’s?)'),
        ],
      },
      {
        id: 'sz-triggers',
        question: 'Possible triggers',
        kind: 'multi',
        options: [
          opt('etoh', 'alcohol/withdrawal'),
          opt('fever', 'fever'),
          opt('pregnancy', 'pregnant (eclampsia?)'),
          opt('head-injury', 'recent head injury'),
          opt('hiv', 'HIV+ (space-occupying lesion?)'),
        ],
      },
    ],
  },
  {
    id: 'joint-limb-pain',
    label: 'Joint / limb pain',
    icon: '🦵',
    depts: ['ortho', 'emergency', 'medicine'],
    blocks: [
      {
        id: 'jt-pattern',
        question: 'Single or multiple joints?',
        kind: 'single',
        options: [
          opt('mono', 'single joint'),
          opt('oligo', '2-4 joints'),
          opt('poly', 'polyarticular'),
        ],
      },
      {
        id: 'jt-trauma',
        question: 'Preceding trauma?',
        kind: 'single',
        options: [
          opt('trauma-yes', 'trauma preceding'),
          opt('trauma-no', 'atraumatic'),
        ],
      },
      {
        id: 'jt-hot',
        question: 'Hot, red, swollen joint?',
        kind: 'toggle',
        why: 'An acutely hot single joint is septic arthritis until aspirated — a joint-destroying, life-threatening emergency, not "gout" by default.',
        options: [opt('hot-joint', 'HOT swollen joint')],
      },
      {
        id: 'jt-function',
        question: 'Function?',
        kind: 'single',
        options: [
          opt('cant-weightbear', 'cannot weight-bear/use limb'),
          opt('reduced-rom', 'reduced range of movement'),
          opt('full-function', 'full function preserved'),
        ],
      },
      {
        id: 'jt-systemic',
        question: 'Systemic features',
        kind: 'multi',
        options: [
          opt('fever', 'fever'),
          opt('rash', 'rash'),
          opt('morning-stiffness', 'morning stiffness >30min'),
          opt('weight-loss', 'weight loss'),
          opt('urethritis-eye', 'urethritis/eye symptoms'),
        ],
      },
    ],
  },
  {
    id: 'cough',
    label: 'Cough',
    icon: '😮‍💨',
    depts: ['medicine', 'emergency', 'paeds'],
    blocks: [
      {
        id: 'cough-duration',
        question: 'Duration?',
        kind: 'single',
        why: 'Any cough >2 weeks in South Africa is a TB screen trigger — sputum for GeneXpert, not just a script for antibiotics.',
        options: [
          opt('lt1w', '<1 week'),
          opt('1-2w', '1-2 weeks'),
          opt('gt2w', '>2 WEEKS (TB flag)'),
          opt('gt1m', '>1 month'),
        ],
      },
      {
        id: 'cough-sputum',
        question: 'Sputum?',
        kind: 'single',
        options: [
          opt('dry', 'dry'),
          opt('productive', 'productive'),
          opt('haemoptysis', 'HAEMOPTYSIS'),
        ],
      },
      {
        id: 'cough-tb-screen',
        question: 'TB screen',
        kind: 'toggle',
        why: 'The WHO four-symptom screen (cough, fever, night sweats, weight loss) plus contact and HIV status decides who gets sputum sent today.',
        options: [
          opt('night-sweats', 'night sweats'),
          opt('weight-loss', 'weight loss'),
          opt('tb-contact', 'TB contact'),
          opt('prev-tb', 'previous TB', [
            {
              id: 'cough-prev-tb',
              question: 'Previous TB treatment?',
              kind: 'single',
              options: [
                opt('completed', 'completed treatment'),
                opt('defaulted', 'defaulted treatment'),
              ],
            },
          ]),
          opt('hiv-pos', 'HIV positive/unknown'),
        ],
      },
      {
        id: 'cough-assoc',
        question: 'Associated?',
        kind: 'multi',
        options: [
          opt('fever', 'fever'),
          opt('sob', 'SOB'),
          opt('pleuritic', 'pleuritic pain'),
          opt('wheeze', 'wheeze'),
          opt('post-nasal', 'post-nasal drip/reflux symptoms'),
        ],
      },
    ],
  },
  {
    id: 'vomiting-diarrhoea',
    label: 'Vomiting / diarrhoea',
    icon: '🤢',
    depts: ['medicine', 'emergency', 'paeds', 'surgery'],
    blocks: [
      {
        id: 'vd-which',
        question: 'What is happening?',
        kind: 'multi',
        options: [
          opt('vomiting', 'vomiting'),
          opt('diarrhoea', 'diarrhoea'),
          opt('both', 'vomiting + diarrhoea'),
        ],
      },
      {
        id: 'vd-blood',
        question: 'Blood?',
        kind: 'single',
        why: 'Blood changes everything: haematemesis → upper GI bleed pathway; bloody diarrhoea → dysentery/invasive infection, avoid antimotility agents.',
        options: [
          opt('haematemesis', 'haematemesis'),
          opt('coffee-ground', 'coffee-ground vomit'),
          opt('bloody-stool', 'bloody diarrhoea'),
          opt('melaena', 'melaena'),
          opt('no-blood', 'no blood'),
        ],
      },
      {
        id: 'vd-duration',
        question: 'Duration?',
        kind: 'single',
        options: [
          opt('lt24h', '<24h'),
          opt('1-3d', '1-3 days'),
          opt('gt3d', '>3 days'),
          opt('gt2w', '>2 weeks (chronic)'),
        ],
      },
      {
        id: 'vd-hydration',
        question: 'Hydration self-report',
        kind: 'multi',
        options: [
          opt('drinking-ok', 'tolerating oral fluids'),
          opt('not-keeping-down', 'nothing staying down'),
          opt('reduced-urine', 'reduced urine output'),
          opt('dizzy-standing', 'dizzy on standing'),
        ],
      },
      {
        id: 'vd-paeds',
        question: 'Paeds hydration (caregiver report)',
        kind: 'multi',
        why: 'Wet nappies are the caregiver-reported urine output — fewer than 4 in 24h in an infant flags significant dehydration.',
        options: [
          opt('wet-nappies-normal', 'wet nappies normal'),
          opt('wet-nappies-reduced', '<4 wet nappies/24h'),
          opt('no-tears', 'crying without tears'),
          opt('lethargic', 'lethargic/floppy'),
          opt('feeding-poorly', 'feeding poorly'),
        ],
      },
      {
        id: 'vd-contacts',
        question: 'Context',
        kind: 'multi',
        options: [
          opt('sick-contacts', 'sick contacts/same food'),
          opt('recent-abx', 'recent antibiotics'),
          opt('fever', 'fever'),
        ],
      },
    ],
  },
  {
    id: 'psych-presentation',
    label: 'Psych presentation',
    icon: '🧠',
    depts: ['psych', 'emergency'],
    blocks: [
      {
        id: 'psy-mood',
        question: 'Predominant picture?',
        kind: 'single',
        options: [
          opt('low', 'low mood'),
          opt('elevated', 'elevated/irritable mood'),
          opt('anxious', 'anxious'),
          opt('psychotic', 'psychotic features prominent'),
          opt('confused', 'confused/disoriented'),
        ],
      },
      {
        id: 'psy-psychotic',
        question: 'Psychotic symptoms?',
        kind: 'multi',
        options: [
          opt('auditory-hall', 'auditory hallucinations'),
          opt('visual-hall', 'visual hallucinations'),
          opt('delusions', 'delusions'),
          opt('paranoia', 'paranoid ideation'),
          opt('disorganized', 'disorganized speech/behaviour'),
          opt('none', 'no psychotic symptoms'),
        ],
      },
      {
        id: 'psy-suicide',
        question: 'Suicide risk — ASK DIRECTLY',
        kind: 'single',
        why: 'Asking directly about suicide does not plant the idea — it is the single highest-yield risk question and it must be documented verbatim.',
        options: [
          opt('denies', 'denies suicidal ideation (asked directly)'),
          opt('ideation', 'suicidal ideation, no plan', [
            {
              id: 'psy-protective',
              question: 'Protective factors?',
              kind: 'multi',
              options: [
                opt('family', 'family support'),
                opt('help-seeking', 'help-seeking'),
                opt('none-protective', 'no protective factors'),
              ],
            },
          ]),
          opt('plan', 'ideation WITH plan', [
            {
              id: 'psy-means',
              question: 'Access to means?',
              kind: 'single',
              options: [
                opt('means-yes', 'has access to means'),
                opt('means-no', 'no access to means'),
              ],
            },
          ]),
          opt('attempt', 'recent attempt'),
        ],
      },
      {
        id: 'psy-substances',
        question: 'Substances',
        kind: 'multi',
        why: 'Substance-induced psychosis and withdrawal states mimic primary psychiatric illness — an organic and substance screen precedes the psych label.',
        options: [
          opt('alcohol', 'alcohol'),
          opt('cannabis', 'cannabis'),
          opt('methamphetamine', 'methamphetamine/tik'),
          opt('other-drugs', 'other drugs'),
          opt('none', 'denies substances'),
        ],
      },
      {
        id: 'psy-danger',
        question: 'Risk to others / self-care',
        kind: 'toggle',
        options: [
          opt('aggression', 'aggression/risk to others'),
          opt('self-neglect', 'self-neglect'),
          opt('first-episode', 'first episode'),
        ],
      },
    ],
  },
];
