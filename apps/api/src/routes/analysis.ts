/**
 * Unified Analysis API — one endpoint for AI analysis of the investigations
 * a consultation generates: Labs, X-rays, ECGs, Ultrasound.
 *
 *   POST /analysis/:consultationId   { modality, reportText? | imageBase64?, ... }
 *   GET  /analysis/:consultationId   list previous analyses (decrypted)
 *
 * Design decisions:
 *   - Text and/or image in — a photo of a printed lab report or an ECG strip
 *     is enough; no lab integration is required (minimal-friction path), while
 *     the /labs webhook remains the zero-touch path for connected providers.
 *   - Every analysis is persisted as an Investigation row, encrypted with the
 *     consultation's own data key, in the same {result} envelope the
 *     clinical-reasoning loop consumes — so an analysed result revises the
 *     differential on the next reasoning pass automatically.
 *   - Critical findings escalate the consultation's triage urgency (never
 *     downgrade) and are audit-logged, so a K+ of 7 doesn't sit quietly in a
 *     table.
 */

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { auditLog } from '../services/audit.service.js';
import { encryptJSON, decryptJSON, decryptDataKey } from '../lib/encryption.js';
import { analyzeInvestigation, type AnalysisModality } from '../services/analysis-ai.js';

const AnalyzeSchema = z
  .object({
    modality: z.enum(['LAB', 'XRAY', 'ECG', 'ULTRASOUND']),
    name: z.string().max(300).optional(),
    reportText: z.string().min(10).max(20000).optional(),
    // ~7.5MB of base64 ≈ 5.5MB image — within Claude's 5MB post-decode limit
    imageBase64: z.string().min(100).max(7_500_000).optional(),
    imageMediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).optional(),
    clinicalQuestion: z.string().max(1000).optional(),
  })
  .refine((v) => v.reportText || v.imageBase64, {
    message: 'Provide reportText, imageBase64, or both.',
  });

const MODALITY_TO_TYPE: Record<AnalysisModality, 'LAB' | 'RADIOLOGY' | 'ECG'> = {
  LAB: 'LAB',
  XRAY: 'RADIOLOGY',
  ULTRASOUND: 'RADIOLOGY',
  ECG: 'ECG',
};

const URGENCY_RANK: Record<string, number> = { ROUTINE: 0, SOON: 1, URGENT: 2, EMERGENCY: 3 };

function toInvestigationUrgency(u: string): 'ROUTINE' | 'URGENT' | 'STAT' {
  if (u === 'EMERGENCY') return 'STAT';
  if (u === 'URGENT' || u === 'SOON') return 'URGENT';
  return 'ROUTINE';
}

export async function analysisRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /analysis/:consultationId — analyse a lab/imaging/ECG result
  // ----------------------------------------------------------
  fastify.post(
    '/analysis/:consultationId',
    {
      preHandler: [authenticate, requireRole('DOCTOR')],
      bodyLimit: 10 * 1024 * 1024, // images travel base64 in the JSON body
    },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;

      const parsed = AnalyzeSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }
      const body = parsed.data;

      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: {
          id: true,
          doctorId: true,
          encryptedDataKey: true,
          triageUrgency: true,
          patient: { select: { dateOfBirth: true, gender: true } },
        },
      });
      if (!consultation) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }
      if (consultation.doctorId !== doctor.id) {
        return reply.status(403).send({
          success: false,
          error: 'You are not the assigned doctor for this consultation.',
          code: 'FORBIDDEN',
        });
      }

      let patientAge: number | undefined;
      if (consultation.patient?.dateOfBirth) {
        const dob = new Date(consultation.patient.dateOfBirth);
        patientAge = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 3600 * 1000));
      }

      try {
        const analysis = await analyzeInvestigation({
          modality: body.modality,
          name: body.name,
          reportText: body.reportText,
          imageBase64: body.imageBase64,
          imageMediaType: body.imageMediaType,
          clinicalQuestion: body.clinicalQuestion,
          patientAge,
          patientGender: consultation.patient?.gender ?? undefined,
        });

        // ── Persist into the diagnostic loop ────────────────────────────────
        // The clinical-reasoning pass decrypts Investigation.encryptedResult
        // and reads {result} — store the compact clinical read there, with the
        // full analysis alongside for the UI.
        let investigationId: string | undefined;
        try {
          const dataKey = await decryptDataKey(consultation.encryptedDataKey);
          const resultForLoop = [
            analysis.impression || analysis.summary,
            analysis.criticalFindings.length
              ? `CRITICAL: ${analysis.criticalFindings.join('; ')}`
              : null,
          ]
            .filter(Boolean)
            .join(' — ');

          const created = await prisma.investigation.create({
            data: {
              consultationId,
              type: MODALITY_TO_TYPE[body.modality],
              name: body.name ?? `${body.modality} analysis`,
              urgency: toInvestigationUrgency(analysis.urgency),
              encryptedResult: encryptJSON(
                {
                  result: resultForLoop,
                  analysis,
                  source: 'MedAI Unified Analysis',
                  analyzedAt: analysis.generatedAt,
                },
                dataKey
              ),
              resultDate: new Date(),
              requestedBy: doctor.id,
            },
          });
          investigationId = created.id;
        } catch (storageErr) {
          fastify.log.error(storageErr, 'analysis storage failed — returning analysis anyway');
        }

        // ── Critical findings escalate triage (never downgrade) ─────────────
        let triageEscalated = false;
        if (
          analysis.criticalFindings.length > 0 &&
          URGENCY_RANK[analysis.urgency] > URGENCY_RANK[consultation.triageUrgency ?? 'ROUTINE']
        ) {
          try {
            await prisma.consultation.update({
              where: { id: consultationId },
              data: { triageUrgency: analysis.urgency as never },
            });
            triageEscalated = true;
          } catch {
            // escalation is best-effort
          }
        }

        await auditLog({
          userId,
          action:
            analysis.criticalFindings.length > 0
              ? 'ANALYSIS_CRITICAL_RESULT'
              : 'ANALYSIS_COMPLETED',
          resource: 'Investigation',
          resourceId: investigationId ?? consultationId,
          metadata: {
            consultationId,
            modality: body.modality,
            hasImage: !!body.imageBase64,
            urgency: analysis.urgency,
            criticalCount: analysis.criticalFindings.length,
            triageEscalated,
          },
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
        });

        return reply.send({
          success: true,
          data: { ...analysis, investigationId, triageEscalated },
        });
      } catch (err) {
        fastify.log.error(err, 'POST /analysis error');
        return reply.status(502).send({
          success: false,
          error: 'AI analysis failed. Please try again or interpret manually.',
          code: 'AI_ERROR',
        });
      }
    }
  );

  // ----------------------------------------------------------
  // GET /analysis/:consultationId — list stored analyses (decrypted)
  // ----------------------------------------------------------
  fastify.get(
    '/analysis/:consultationId',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user!.sub;

      const doctor = await prisma.doctor.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found.' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        select: { id: true, doctorId: true, encryptedDataKey: true },
      });
      if (!consultation || consultation.doctorId !== doctor.id) {
        return reply.status(404).send({ success: false, error: 'Consultation not found.' });
      }

      const investigations = await prisma.investigation.findMany({
        where: { consultationId, encryptedResult: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, type: true, name: true, urgency: true, createdAt: true, encryptedResult: true },
      });

      const analyses: Array<Record<string, unknown>> = [];
      try {
        const dataKey = await decryptDataKey(consultation.encryptedDataKey);
        for (const inv of investigations) {
          try {
            const stored = decryptJSON(inv.encryptedResult!, dataKey) as {
              analysis?: unknown;
              source?: string;
            };
            if (stored?.source === 'MedAI Unified Analysis' && stored.analysis) {
              analyses.push({
                investigationId: inv.id,
                name: inv.name,
                type: inv.type,
                urgency: inv.urgency,
                createdAt: inv.createdAt,
                ...(stored.analysis as Record<string, unknown>),
              });
            }
          } catch {
            // rows written by other flows or with other envelopes — skip
          }
        }
      } catch {
        // key unavailable — return empty rather than error
      }

      return reply.send({ success: true, data: { analyses, count: analyses.length } });
    }
  );
}
