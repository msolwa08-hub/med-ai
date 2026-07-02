/**
 * STG (Standard Treatment Guidelines) seeder
 *
 * Single source of truth: apps/api/src/data/stg-entries.ts (STG_ENTRIES).
 * This script converts each entry into the ICD10Code + STGEntry rows that
 * back /stg/search, /stg/categories, /stg/adapted (mobile STG Lookup screen)
 * AND the AI clinical reasoning tool's STG linkage (clinical-reasoning.ts) —
 * both read from this same DB table, so guideline content only lives once.
 *
 * Re-run any time STG_ENTRIES changes: npm run db:seed:stg
 */
import { PrismaClient, Prisma } from '@prisma/client';
import { STG_ENTRIES, type STGSeedEntry, type STGMedication, type STGInvestigation } from '../data/stg-entries.js';

const prisma = new PrismaClient();

const TIMING_TO_URGENCY: Record<STGInvestigation['timing'], string> = {
  Immediate: 'STAT',
  'Same day': 'URGENT',
  Urgent: 'URGENT',
  Routine: 'ROUTINE',
};

function toTreatmentJson(meds: STGMedication[] | undefined): Prisma.InputJsonValue {
  return (meds ?? []).map((m) => ({
    medication: m.name,
    dose: m.dose,
    route: m.route,
    frequency: m.frequency,
    duration: m.duration,
    notes: m.notes,
  })) as unknown as Prisma.InputJsonValue;
}

function toInvestigationsJson(investigations: STGInvestigation[]): Prisma.InputJsonValue {
  return investigations.map((i) => ({
    name: i.name,
    urgency: TIMING_TO_URGENCY[i.timing] ?? 'ROUTINE',
    rationale: i.notes ?? '',
  })) as unknown as Prisma.InputJsonValue;
}

/** Convert a rich STGSeedEntry into the flatter DB row shape. */
function toDbRow(entry: STGSeedEntry) {
  const notesParts = [
    entry.nonPharmacological?.length
      ? `Non-pharmacological: ${entry.nonPharmacological.join('; ')}`
      : null,
    entry.patientEducation?.length
      ? `Patient education: ${entry.patientEducation.join('; ')}`
      : null,
    entry.contraindications?.length
      ? `Contraindications: ${entry.contraindications.join('; ')}`
      : null,
    entry.specialPopulations ? `Special populations: ${entry.specialPopulations}` : null,
  ].filter(Boolean);

  const emergencyReferrals = entry.referralCriteria.filter((r) =>
    /emergency|urgent|immediate/i.test(r)
  );

  return {
    code: entry.icdCode,
    description: entry.condition,
    icdCategory: entry.category,
    condition: {
      conditionName: entry.condition,
      synonyms: [] as string[],
      category: entry.category,
      subCategory: undefined as string | undefined,
      levelOfCare: entry.levelOfCare,
      firstLineTreatment: toTreatmentJson(entry.firstLinemedications),
      alternativeTreatment: entry.secondLineMedications
        ? toTreatmentJson(entry.secondLineMedications)
        : undefined,
      investigations: toInvestigationsJson(entry.investigations),
      referralCriteria: entry.referralCriteria.join('; '),
      redFlags: emergencyReferrals.length ? emergencyReferrals.join('; ') : undefined,
      followUpAdvice: entry.followUpSchedule,
      notes: notesParts.length ? notesParts.join('\n') : undefined,
      saPrevalence: entry.saPrevalence,
    },
  };
}

async function main() {
  console.log(`Seeding ${STG_ENTRIES.length} STG entries from data/stg-entries.ts...`);
  let count = 0;

  for (const raw of STG_ENTRIES) {
    const entry = toDbRow(raw);
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
          alternativeTreatment: entry.condition.alternativeTreatment ?? Prisma.JsonNull,
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
          alternativeTreatment: entry.condition.alternativeTreatment ?? Prisma.JsonNull,
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
