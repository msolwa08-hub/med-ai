import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';

// ============================================================
// Schemas
// ============================================================

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

const ICD10SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
});

const AdaptedSTGSchema = z.object({
  icd10Code: z.string().min(1).max(20),
  consultationId: z.string().min(1),
});

const SeedSTGSchema = z.array(
  z.object({
    icd10Code: z.string().min(1).max(20),
    conditionName: z.string().min(1).max(500),
    synonyms: z.array(z.string()).default([]),
    category: z.string().min(1).max(200),
    subCategory: z.string().max(200).optional(),
    levelOfCare: z.enum(['Primary', 'Secondary', 'Tertiary', 'All']),
    edition: z.string().default('8th Edition 2023'),
    firstLineTreatment: z.array(z.unknown()),
    alternativeTreatment: z.array(z.unknown()).optional(),
    investigations: z.array(z.unknown()),
    referralCriteria: z.string().optional(),
    redFlags: z.string().optional(),
    followUpAdvice: z.string().optional(),
    notes: z.string().optional(),
    saPrevalence: z.enum(['Common', 'Uncommon', 'Rare in SA']).optional(),
  })
);

// ============================================================
// Types returned to callers
// ============================================================

interface STGEntry {
  id: string;
  icd10Code: string;
  conditionName: string;
  synonyms: string[];
  category: string;
  subCategory: string | null;
  levelOfCare: string;
  edition: string;
  firstLineTreatment: unknown;
  alternativeTreatment: unknown;
  investigations: unknown;
  referralCriteria: string | null;
  redFlags: string | null;
  followUpAdvice: string | null;
  notes: string | null;
  saPrevalence: string | null;
}

// ============================================================
// Route plugin
// ============================================================

export async function stgRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // GET /stg/search?q=query — Search STG by condition name
  // ----------------------------------------------------------
  fastify.get(
    '/stg/search',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const parsed = SearchQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Query parameter "q" is required.',
            details: parsed.error.flatten(),
          });
        }

        const { q } = parsed.data;
        const term = q.trim().toLowerCase();

        const entries = await prisma.sTGEntry.findMany({
          where: {
            OR: [
              { conditionName: { contains: term, mode: 'insensitive' } },
              { synonyms: { has: term } },
              { icd10Code: { contains: term, mode: 'insensitive' } },
              { category: { contains: term, mode: 'insensitive' } },
            ],
          },
          orderBy: { conditionName: 'asc' },
          take: 20,
        });

        return reply.send({
          success: true,
          data: {
            results: entries as STGEntry[],
            count: entries.length,
            query: q,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /stg/search error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /stg/icd10/search?q=query — Search ICD-10 codes
  // (Must come before /stg/icd10/:code to avoid route collision)
  // ----------------------------------------------------------
  fastify.get(
    '/stg/icd10/search',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const parsed = ICD10SearchQuerySchema.safeParse(request.query);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Query parameter "q" is required.',
            details: parsed.error.flatten(),
          });
        }

        const { q } = parsed.data;

        const codes = await prisma.iCD10Code.findMany({
          where: {
            OR: [
              { code: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { category: { contains: q, mode: 'insensitive' } },
            ],
          },
          orderBy: { code: 'asc' },
          take: 30,
          select: {
            code: true,
            description: true,
            category: true,
            blockCode: true,
            isLeaf: true,
            // Include STG entry existence indicator
            stgEntry: { select: { id: true, conditionName: true } },
          },
        });

        return reply.send({
          success: true,
          data: {
            results: codes.map((c) => ({
              code: c.code,
              description: c.description,
              category: c.category,
              blockCode: c.blockCode,
              isLeaf: c.isLeaf,
              hasSTG: c.stgEntry !== null,
              stgConditionName: c.stgEntry?.conditionName ?? null,
            })),
            count: codes.length,
            query: q,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /stg/icd10/search error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /stg/icd10/:code — Get STG entry by ICD-10 code
  // ----------------------------------------------------------
  fastify.get(
    '/stg/icd10/:code',
    { preHandler: [authenticate] },
    async (request, reply) => {
      try {
        const { code } = request.params as { code: string };

        const entry = await prisma.sTGEntry.findUnique({
          where: { icd10Code: code.toUpperCase() },
          include: {
            icd10: {
              select: {
                code: true,
                description: true,
                category: true,
                blockCode: true,
              },
            },
          },
        });

        if (!entry) {
          return reply.status(404).send({
            success: false,
            error: `No STG entry found for ICD-10 code "${code}".`,
            code: 'NOT_FOUND',
          });
        }

        return reply.send({
          success: true,
          data: { entry },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /stg/icd10/:code error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /stg/adapted — Get AI-adapted STG for specific patient
  // ----------------------------------------------------------
  fastify.post(
    '/stg/adapted',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      try {
        const userId = request.user!.sub;

        const parsed = AdaptedSTGSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const { icd10Code, consultationId } = parsed.data;

        // Fetch the STG entry
        const stgEntry = await prisma.sTGEntry.findUnique({
          where: { icd10Code: icd10Code.toUpperCase() },
        });

        if (!stgEntry) {
          return reply.status(404).send({
            success: false,
            error: `No STG entry found for ICD-10 code "${icd10Code}".`,
            code: 'STG_NOT_FOUND',
          });
        }

        // Fetch consultation context for adaptation
        const consultation = await prisma.consultation.findUnique({
          where: { id: consultationId },
          include: {
            patient: {
              select: {
                dateOfBirth: true,
                gender: true,
                preferredLanguage: true,
              },
            },
            doctor: { select: { id: true } },
            managementPlan: { select: { id: true } },
          },
        });

        if (!consultation) {
          return reply.status(404).send({
            success: false,
            error: 'Consultation not found.',
            code: 'NOT_FOUND',
          });
        }

        // Verify the requesting doctor is assigned to this consultation
        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { id: true },
        });

        if (!doctor || consultation.doctor?.id !== doctor.id) {
          return reply.status(403).send({
            success: false,
            error: 'You are not the assigned doctor for this consultation.',
            code: 'FORBIDDEN',
          });
        }

        // Calculate patient age
        const patientAge = consultation.patient
          ? Math.floor(
              (Date.now() - new Date(consultation.patient.dateOfBirth).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )
          : null;

        // Build patient-specific adaptation notes
        const adaptationNotes: string[] = [];

        if (patientAge !== null) {
          if (patientAge < 18) {
            adaptationNotes.push(
              `Paediatric patient (age ${patientAge}): verify weight-based dosing and paediatric-specific contraindications.`
            );
          } else if (patientAge >= 65) {
            adaptationNotes.push(
              `Elderly patient (age ${patientAge}): consider renal/hepatic function, reduce doses where indicated, review polypharmacy.`
            );
          }
        }

        if (consultation.patient?.gender === 'FEMALE') {
          adaptationNotes.push(
            'Female patient: check pregnancy/lactation status before prescribing.'
          );
        }

        await auditLog({
          userId,
          action: 'STG_ADAPTED_VIEWED',
          resource: 'STGEntry',
          resourceId: stgEntry.id,
          metadata: {
            icd10Code,
            consultationId,
            patientAge,
            gender: consultation.patient?.gender,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: {
            stgEntry,
            patientContext: {
              age: patientAge,
              gender: consultation.patient?.gender ?? null,
              preferredLanguage: consultation.patient?.preferredLanguage ?? 'en',
            },
            adaptationNotes,
          },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /stg/adapted error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /stg/categories — List all STG categories
  // ----------------------------------------------------------
  fastify.get(
    '/stg/categories',
    { preHandler: [authenticate] },
    async (_request, reply) => {
      try {
        const categories = await prisma.sTGEntry.groupBy({
          by: ['category'],
          _count: { category: true },
          orderBy: { category: 'asc' },
        });

        return reply.send({
          success: true,
          data: {
            categories: categories.map((c) => ({
              name: c.category,
              entryCount: c._count.category,
            })),
          },
        });
      } catch (err) {
        fastify.log.error(err, 'GET /stg/categories error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // POST /stg/seed — Admin only: seed STG database
  // ----------------------------------------------------------
  fastify.post(
    '/stg/seed',
    { preHandler: [authenticate, requireRole('ADMIN')] },
    async (request, reply) => {
      try {
        const parsed = SeedSTGSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            success: false,
            error: 'Validation failed',
            details: parsed.error.flatten(),
          });
        }

        const entries = parsed.data;
        let created = 0;
        let updated = 0;
        const errors: Array<{ icd10Code: string; error: string }> = [];

        for (const entry of entries) {
          try {
            // Ensure the ICD-10 code exists (upsert if needed)
            await prisma.iCD10Code.upsert({
              where: { code: entry.icd10Code },
              create: {
                code: entry.icd10Code,
                description: entry.conditionName,
                category: entry.category,
              },
              update: {},
            });

            const existing = await prisma.sTGEntry.findUnique({
              where: { icd10Code: entry.icd10Code },
            });

            if (existing) {
              await prisma.sTGEntry.update({
                where: { icd10Code: entry.icd10Code },
                data: {
                  conditionName: entry.conditionName,
                  synonyms: entry.synonyms,
                  category: entry.category,
                  subCategory: entry.subCategory ?? null,
                  levelOfCare: entry.levelOfCare,
                  edition: entry.edition,
                  firstLineTreatment: entry.firstLineTreatment,
                  alternativeTreatment: entry.alternativeTreatment ?? null,
                  investigations: entry.investigations,
                  referralCriteria: entry.referralCriteria ?? null,
                  redFlags: entry.redFlags ?? null,
                  followUpAdvice: entry.followUpAdvice ?? null,
                  notes: entry.notes ?? null,
                  saPrevalence: entry.saPrevalence ?? null,
                },
              });
              updated++;
            } else {
              await prisma.sTGEntry.create({
                data: {
                  icd10Code: entry.icd10Code,
                  conditionName: entry.conditionName,
                  synonyms: entry.synonyms,
                  category: entry.category,
                  subCategory: entry.subCategory ?? null,
                  levelOfCare: entry.levelOfCare,
                  edition: entry.edition,
                  firstLineTreatment: entry.firstLineTreatment,
                  alternativeTreatment: entry.alternativeTreatment ?? null,
                  investigations: entry.investigations,
                  referralCriteria: entry.referralCriteria ?? null,
                  redFlags: entry.redFlags ?? null,
                  followUpAdvice: entry.followUpAdvice ?? null,
                  notes: entry.notes ?? null,
                  saPrevalence: entry.saPrevalence ?? null,
                },
              });
              created++;
            }
          } catch (entryErr) {
            errors.push({
              icd10Code: entry.icd10Code,
              error: entryErr instanceof Error ? entryErr.message : String(entryErr),
            });
          }
        }

        await auditLog({
          userId: request.user!.sub,
          action: 'STG_SEEDED',
          resource: 'STGEntry',
          metadata: { total: entries.length, created, updated, errors: errors.length },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.status(201).send({
          success: true,
          data: {
            total: entries.length,
            created,
            updated,
            failed: errors.length,
            errors: errors.length > 0 ? errors : undefined,
          },
          message: `STG seed complete: ${created} created, ${updated} updated${errors.length > 0 ? `, ${errors.length} failed` : ''}.`,
        });
      } catch (err) {
        fastify.log.error(err, 'POST /stg/seed error');
        return reply.status(500).send({
          success: false,
          error: 'Internal server error.',
        });
      }
    }
  );
}
