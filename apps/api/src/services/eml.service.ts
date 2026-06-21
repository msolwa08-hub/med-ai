import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EMLLookupInput {
  medicineName: string;
  formulation?: string;
}

export interface EMLEntry {
  genericName: string;
  brandExamples: string[];
  schedule: string;
  atcCode?: string;
  formulations: Array<{
    form: string;
    strength: string;
    levelOfCare: 'PHC' | 'District' | 'Regional' | 'Tertiary' | 'All';
    notes?: string;
  }>;
  isOnEML: boolean;
  emlCategory: 'Core' | 'Complementary' | 'Not Listed';
  therapeuticCategory: string;
  costTier: 'Free (public sector)' | 'Low-cost generic' | 'Moderate' | 'Expensive' | 'Specialist only';
  publicSectorAvailability: string;
  prescribingRestrictions?: string;
  saContext: string;
  alternatives?: string[];
  generatedAt: string;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a South African pharmacist and clinical pharmacologist with expert knowledge of the SA National Essential Medicines List (EML) and the Standard Treatment Guidelines (7th/8th edition). You assist doctors and interns with evidence-based medicine information in the South African public healthcare context.

When asked about a medicine, provide accurate information about:
- Whether it is on the SA EML (Core or Complementary list)
- Its schedule (S0–S6 under SAHPRA)
- Available formulations and strengths in SA public sector
- Level of care at which it is available (PHC/District/Regional/Tertiary)
- Cost tier and public sector availability
- Prescribing restrictions (if any)
- SA-specific context (TB programme, CCMDD, ART dispensing, etc.)
- Evidence-based alternatives if not on EML

Respond ONLY with valid JSON — no markdown, no extra text.`;

// ─── Service ──────────────────────────────────────────────────────────────────

export async function emlLookup(input: EMLLookupInput): Promise<EMLEntry> {
  const userPrompt = `Look up this medicine in the SA Essential Medicines List:

Medicine: ${input.medicineName}
${input.formulation ? `Formulation: ${input.formulation}` : ''}

Return a JSON object with this exact structure:
{
  "genericName": "INN generic name",
  "brandExamples": ["Brand1", "Brand2"],
  "schedule": "S3",
  "atcCode": "A10BA02",
  "formulations": [
    {
      "form": "Tablet",
      "strength": "500mg",
      "levelOfCare": "PHC",
      "notes": "optional prescribing note"
    }
  ],
  "isOnEML": true,
  "emlCategory": "Core",
  "therapeuticCategory": "Cardiovascular",
  "costTier": "Free (public sector)",
  "publicSectorAvailability": "Available at all public sector facilities",
  "prescribingRestrictions": "null or restriction text",
  "saContext": "Short paragraph about SA-specific context, usage patterns, procurement",
  "alternatives": ["Alternative1 if not on EML"],
  "generatedAt": "${new Date().toISOString()}"
}

emlCategory must be one of: "Core", "Complementary", "Not Listed"
levelOfCare must be one of: "PHC", "District", "Regional", "Tertiary", "All"
costTier must be one of: "Free (public sector)", "Low-cost generic", "Moderate", "Expensive", "Specialist only"`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content[0].type === 'text' ? response.content[0].text : '';
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned) as EMLEntry;
}
