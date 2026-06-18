/**
 * South African Standard Treatment Guidelines (STG) Service
 *
 * Provides:
 *   1. STG lookup by ICD-10 code or condition name
 *   2. AI-enhanced management plan generation (for doctors)
 *   3. ICD-10 code search
 *
 * All AI-generated clinical advice is for HPCSA-registered doctors only.
 */

import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import { STG_ENTRIES } from '../data/stg-entries.js';
import { searchICD10Codes, getICD10ByCode, ICD10_COMMON_CODES } from '../data/icd10-common.js';
import type { STGSeedEntry, STGMedication, STGInvestigation } from '../data/stg-entries.js';
import type { ICD10Code } from '../data/icd10-common.js';
import type Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Types
// ============================================================

export interface AdaptedSTGResponse {
  icdCode: string;
  condition: string;
  stgEntry: STGSeedEntry;
  aiManagementPlan?: string;
  adaptedForPatientFactors?: string;
  checklist: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  category: 'Investigation' | 'Medication' | 'NonPharmacological' | 'Referral' | 'FollowUp' | 'Education';
  text: string;
  completed: boolean;
  urgent: boolean;
}

export interface STGLookupResult {
  found: boolean;
  entries: STGSeedEntry[];
  icdMatches: ICD10Code[];
  searchQuery: string;
}

export interface PatientContext {
  age: number;
  gender: string;
  weight?: number;
  isPregnant?: boolean;
  isHIVPositive?: boolean;
  cd4Count?: number;
  allergies?: string[];
  currentMedications?: string[];
  comorbidities?: string[];
  renalFunction?: 'Normal' | 'Mild impairment' | 'Moderate impairment' | 'Severe impairment';
}

// ============================================================
// STG Lookup Functions
// ============================================================

/**
 * Look up STG entries by ICD-10 code (exact match)
 */
export function getSTGByICD10(icdCode: string): STGSeedEntry | undefined {
  return STG_ENTRIES.find(
    (entry) => entry.icdCode.toUpperCase() === icdCode.toUpperCase()
  );
}

/**
 * Search STG entries by condition name, ICD code, or category
 */
export function searchSTGEntries(query: string): STGLookupResult {
  const q = query.toLowerCase().trim();

  const entries = STG_ENTRIES.filter((entry) => {
    return (
      entry.icdCode.toLowerCase().includes(q) ||
      entry.condition.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q)
    );
  });

  const icdMatches = searchICD10Codes(query, 10);

  return {
    found: entries.length > 0 || icdMatches.length > 0,
    entries,
    icdMatches,
    searchQuery: query,
  };
}

/**
 * Get all STG entries by category
 */
export function getSTGByCategory(category: string): STGSeedEntry[] {
  return STG_ENTRIES.filter(
    (entry) => entry.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get all unique categories in the STG database
 */
export function getSTGCategories(): string[] {
  return [...new Set(STG_ENTRIES.map((e) => e.category))].sort();
}

// ============================================================
// Checklist Generation
// ============================================================

/**
 * Build a clinical checklist from an STG entry
 */
export function buildClinicalChecklist(entry: STGSeedEntry): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let idCounter = 0;
  const nextId = () => `item-${++idCounter}`;

  // Investigations
  for (const inv of entry.investigations) {
    items.push({
      id: nextId(),
      category: 'Investigation',
      text: `${inv.name}${inv.notes ? ` — ${inv.notes}` : ''}`,
      completed: false,
      urgent: inv.timing === 'Immediate' || inv.timing === 'Urgent',
    });
  }

  // First-line medications
  for (const med of entry.firstLinemedications) {
    items.push({
      id: nextId(),
      category: 'Medication',
      text: `Prescribe: ${med.name} ${med.dose} ${med.route} ${med.frequency} × ${med.duration}${med.notes ? ` (${med.notes})` : ''}`,
      completed: false,
      urgent: false,
    });
  }

  // Non-pharmacological
  for (const np of entry.nonPharmacological) {
    items.push({
      id: nextId(),
      category: 'NonPharmacological',
      text: np,
      completed: false,
      urgent: false,
    });
  }

  // Referral criteria
  for (const ref of entry.referralCriteria) {
    items.push({
      id: nextId(),
      category: 'Referral',
      text: `Referral if: ${ref}`,
      completed: false,
      urgent: ref.toLowerCase().includes('emergency') || ref.toLowerCase().includes('urgent'),
    });
  }

  // Follow-up
  items.push({
    id: nextId(),
    category: 'FollowUp',
    text: entry.followUpSchedule,
    completed: false,
    urgent: false,
  });

  // Patient education
  for (const edu of entry.patientEducation) {
    items.push({
      id: nextId(),
      category: 'Education',
      text: `Educate patient: ${edu}`,
      completed: false,
      urgent: false,
    });
  }

  return items;
}

// ============================================================
// AI-Enhanced Management Plan
// ============================================================

/**
 * Generate an AI-enhanced, patient-specific management plan
 * using the STG entry as the evidence base.
 *
 * FOR HPCSA-REGISTERED DOCTORS ONLY.
 */
export async function generateAIManagementPlan(
  stgEntry: STGSeedEntry,
  patientContext: PatientContext,
  chiefComplaint: string,
  structuredHistory?: string
): Promise<string> {
  const patientFactors = buildPatientFactorsText(patientContext);
  const stgSummary = buildSTGSummaryText(stgEntry);

  const systemPrompt = `You are a clinical decision support AI for HPCSA-registered South African doctors.

You assist doctors by adapting evidence-based South African DoH Standard Treatment Guidelines to individual patient circumstances.

CRITICAL RULES:
- This is for doctors only — use medical terminology appropriately
- Always acknowledge the STG as the evidence base
- Highlight deviations from standard treatment when patient factors require it
- Flag drug interactions and contraindications
- Consider SA-specific context (HIV prevalence, TB, resource constraints)
- Be concise and clinically practical
- Format with clear headers and bullet points

YOUR ROLE: Adapt the STG management plan to this specific patient's circumstances.`;

  const userMessage = `
PATIENT PRESENTATION:
Chief complaint: ${chiefComplaint}
${structuredHistory ? `Clinical history: ${structuredHistory}` : ''}

PATIENT FACTORS:
${patientFactors}

SOUTH AFRICAN STANDARD TREATMENT GUIDELINE (Evidence Base):
${stgSummary}

Please provide a concise, adapted management plan for this specific patient, highlighting:
1. First-line treatment (adapted for patient factors)
2. Investigations to order (with priority)
3. Any contraindications or dose adjustments needed
4. Referral decision (criteria met? Y/N with reasoning)
5. Follow-up plan
6. Patient education points

Keep the response under 500 words. Flag any URGENT actions prominently.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return extractText(response);
}

/**
 * Generate a complete AdaptedSTGResponse for a given ICD code and patient
 */
export async function getAdaptedSTGResponse(
  icdCode: string,
  patientContext: PatientContext,
  chiefComplaint: string,
  structuredHistory?: string,
  generateAI = true
): Promise<AdaptedSTGResponse | null> {
  const stgEntry = getSTGByICD10(icdCode);
  if (!stgEntry) return null;

  const checklist = buildClinicalChecklist(stgEntry);

  let aiManagementPlan: string | undefined;
  let adaptedForPatientFactors: string | undefined;

  if (generateAI) {
    try {
      aiManagementPlan = await generateAIManagementPlan(
        stgEntry,
        patientContext,
        chiefComplaint,
        structuredHistory
      );

      // Generate patient factor adaptations summary
      adaptedForPatientFactors = buildPatientAdaptationSummary(stgEntry, patientContext);
    } catch (err) {
      console.error('[STG] AI management plan generation failed:', err);
    }
  }

  return {
    icdCode,
    condition: stgEntry.condition,
    stgEntry,
    aiManagementPlan,
    adaptedForPatientFactors,
    checklist,
  };
}

/**
 * Search ICD-10 codes (re-export for convenience)
 */
export { searchICD10Codes, getICD10ByCode, ICD10_COMMON_CODES };

// ============================================================
// Private Helpers
// ============================================================

function extractText(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block?.type === 'text') return block.text;
  return '';
}

function buildPatientFactorsText(ctx: PatientContext): string {
  const lines: string[] = [
    `- Age: ${ctx.age} years`,
    `- Gender: ${ctx.gender}`,
  ];
  if (ctx.weight) lines.push(`- Weight: ${ctx.weight} kg`);
  if (ctx.isPregnant) lines.push('- Pregnant: YES *** Clinical adaptations required ***');
  if (ctx.isHIVPositive) {
    lines.push('- HIV status: POSITIVE');
    if (ctx.cd4Count !== undefined) lines.push(`  - CD4 count: ${ctx.cd4Count} cells/μL`);
  }
  if (ctx.allergies?.length) lines.push(`- Allergies: ${ctx.allergies.join(', ')}`);
  if (ctx.currentMedications?.length) lines.push(`- Current medications: ${ctx.currentMedications.join(', ')}`);
  if (ctx.comorbidities?.length) lines.push(`- Comorbidities: ${ctx.comorbidities.join(', ')}`);
  if (ctx.renalFunction && ctx.renalFunction !== 'Normal') {
    lines.push(`- Renal function: ${ctx.renalFunction} — dose adjustments may be required`);
  }
  return lines.join('\n');
}

function buildSTGSummaryText(entry: STGSeedEntry): string {
  const firstLineMeds = entry.firstLinemedications
    .map((m) => `  • ${m.name} ${m.dose} ${m.route} ${m.frequency} × ${m.duration}${m.notes ? ` (${m.notes})` : ''}`)
    .join('\n');

  const investigations = entry.investigations
    .map((i) => `  • [${i.timing}] ${i.name}${i.notes ? ` — ${i.notes}` : ''}`)
    .join('\n');

  const referral = entry.referralCriteria.map((r) => `  • ${r}`).join('\n');

  return `
Condition: ${entry.condition} (${entry.icdCode})
Level of care: ${entry.levelOfCare}
SA Prevalence: ${entry.saPrevalence}

First-line medications:
${firstLineMeds}

Key investigations:
${investigations}

Referral criteria:
${referral}

Follow-up: ${entry.followUpSchedule}
${entry.specialPopulations ? `\nSpecial populations: ${entry.specialPopulations}` : ''}
${entry.contraindications ? `\nContraindications: ${entry.contraindications.join('; ')}` : ''}
  `.trim();
}

function buildPatientAdaptationSummary(entry: STGSeedEntry, ctx: PatientContext): string {
  const adaptations: string[] = [];

  if (ctx.isPregnant) {
    adaptations.push('PREGNANCY: Avoid NSAIDs (all trimesters), tetracyclines, fluoroquinolones. Paracetamol is safe. Consult obstetric team.');
    if (entry.icdCode.startsWith('A15') || entry.icdCode.startsWith('A16')) {
      adaptations.push('TB IN PREGNANCY: Avoid pyrazinamide (PZA) in first trimester if possible. Rifampicin is safe.');
    }
  }

  if (ctx.isHIVPositive) {
    adaptations.push('HIV POSITIVE: Screen for TB co-infection. Consider ART interactions with rifampicin (if TB treatment). Higher risk of infections and treatment failure.');
    if (ctx.cd4Count !== undefined && ctx.cd4Count < 200) {
      adaptations.push(`CD4 ${ctx.cd4Count}: Immunocompromised — consider empirical TB treatment, screen for opportunistic infections, cotrimoxazole prophylaxis.`);
    }
  }

  if (ctx.renalFunction && ctx.renalFunction !== 'Normal') {
    adaptations.push(`RENAL IMPAIRMENT (${ctx.renalFunction}): Dose adjust or avoid: NSAIDs, metformin, certain antibiotics, tenofovir. Prefer: paracetamol, dose-adjusted antibiotics.`);
  }

  if (ctx.allergies?.length) {
    const allergyList = ctx.allergies.join(', ');
    adaptations.push(`ALLERGIES (${allergyList}): Review all prescribed medications for cross-reactions.`);
  }

  if (ctx.age >= 65) {
    adaptations.push('ELDERLY: Start low doses, titrate slowly. Increased fall risk with sedatives, antihypertensives. Avoid NSAIDs if possible.');
  }

  if (ctx.age < 12) {
    adaptations.push('PAEDIATRIC: Weight-based dosing required. Avoid tetracyclines, fluoroquinolones. Adjust all doses by weight.');
  }

  return adaptations.length > 0
    ? adaptations.join('\n\n')
    : 'No specific adaptations identified for stated patient factors.';
}

/**
 * Format STG medication for prescription display
 */
export function formatMedicationForPrescription(med: STGMedication): string {
  return `${med.name} ${med.dose} ${med.route}, ${med.frequency}, for ${med.duration}${med.notes ? `\n  Note: ${med.notes}` : ''}`;
}

/**
 * Get urgent investigations from an STG entry
 */
export function getUrgentInvestigations(entry: STGSeedEntry): STGInvestigation[] {
  return entry.investigations.filter(
    (inv) => inv.timing === 'Immediate' || inv.timing === 'Urgent'
  );
}
