// Doctor cockpit API — gated by a doctor key (separate from patient access keys).
//
// Lets the doctor list completed consults, review the AI history + summary, add
// examination findings, generate a DRAFT clinical package (differentials with
// ICD-10 + probability, investigations, management, draft script, draft sick
// note), and actively confirm/sign it. Built draft-and-confirm by design — the
// doctor must review and confirm; nothing here is auto-applied.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { betaConfig } from '../lib/beta-config.js';
import {
  listConsults,
  getConsultDetail,
  saveExamFindings,
  buildClinicalPackage,
  confirmClinicalPackage,
} from '../services/beta-engine.js';
import type { ClinicalPackage, ExamFindings, PracticeMode } from '../services/clinical-package.js';

const ExamSchema = z.object({
  vitals: z
    .object({
      bloodPressure: z.string().optional(),
      heartRate: z.string().optional(),
      respRate: z.string().optional(),
      temperature: z.string().optional(),
      spo2: z.string().optional(),
      weight: z.string().optional(),
      height: z.string().optional(),
    })
    .optional(),
  generalInspection: z.string().optional(),
  systemFindings: z.string().optional(),
  freeText: z.string().optional(),
});

function doctorKeys(): string[] {
  return (betaConfig.BETA_DOCTOR_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function isValidDoctorKey(key: string | undefined): boolean {
  return !!key && doctorKeys().includes(key);
}

// Returns true if authorised; otherwise sends 401 and returns false.
function requireDoctor(request: FastifyRequest, reply: FastifyReply): boolean {
  const key = request.headers['x-doctor-key'];
  const value = Array.isArray(key) ? key[0] : key;
  if (!isValidDoctorKey(value)) {
    reply.status(401).send({ success: false, error: 'Invalid or missing doctor key' });
    return false;
  }
  return true;
}

export async function cockpitRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /cockpit/validate — check a doctor key
  fastify.post('/cockpit/validate', async (request, reply) => {
    const body = request.body as { doctorKey?: string } | undefined;
    return reply.send({ success: true, data: { valid: isValidDoctorKey(body?.doctorKey) } });
  });

  // GET /cockpit/consults — list consults for the practice
  fastify.get('/cockpit/consults', async (request, reply) => {
    if (!requireDoctor(request, reply)) return;
    return reply.send({ success: true, data: { consults: listConsults() } });
  });

  // GET /cockpit/consults/:id — full detail (transcript, summary, exam, package)
  fastify.get('/cockpit/consults/:id', async (request, reply) => {
    if (!requireDoctor(request, reply)) return;
    const { id } = request.params as { id: string };
    const detail = getConsultDetail(id);
    if (!detail) {
      return reply.status(404).send({ success: false, error: 'Consult not found or expired' });
    }
    return reply.send({ success: true, data: detail });
  });

  // POST /cockpit/consults/:id/exam — save examination findings
  fastify.post('/cockpit/consults/:id/exam', async (request, reply) => {
    if (!requireDoctor(request, reply)) return;
    const { id } = request.params as { id: string };
    const parsed = ExamSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ success: false, error: 'Invalid exam findings', details: parsed.error.flatten() });
    }
    const ok = saveExamFindings(id, parsed.data as ExamFindings);
    if (!ok) return reply.status(404).send({ success: false, error: 'Consult not found or expired' });
    return reply.send({ success: true, data: getConsultDetail(id) });
  });

  // POST /cockpit/consults/:id/package — generate the DRAFT clinical package
  fastify.post('/cockpit/consults/:id/package', async (request, reply) => {
    if (!requireDoctor(request, reply)) return;
    const { id } = request.params as { id: string };
    const body = request.body as { practiceMode?: string } | undefined;
    const practiceMode = (['ACUTE_VOLUME', 'FAMILY_PRACTICE', 'HOLISTIC'] as PracticeMode[]).find(
      (m) => m === body?.practiceMode
    );
    const detail = getConsultDetail(id);
    if (!detail) {
      return reply.status(404).send({ success: false, error: 'Consult not found or expired' });
    }
    if (!detail.isComplete) {
      return reply
        .status(400)
        .send({ success: false, error: 'History not yet complete — cannot generate package' });
    }
    try {
      const pkg = await buildClinicalPackage(id, practiceMode);
      return reply.send({ success: true, data: { package: pkg } });
    } catch (err) {
      fastify.log.error(err, 'cockpit: package generation failed');
      return reply.status(500).send({ success: false, error: 'Failed to generate clinical package' });
    }
  });

  // POST /cockpit/consults/:id/confirm — store the doctor-reviewed/edited package
  fastify.post('/cockpit/consults/:id/confirm', async (request, reply) => {
    if (!requireDoctor(request, reply)) return;
    const { id } = request.params as { id: string };
    const body = request.body as { package?: unknown } | undefined;
    if (!body || typeof body.package !== 'object' || body.package === null) {
      return reply.status(400).send({ success: false, error: 'A reviewed package is required' });
    }
    const ok = confirmClinicalPackage(id, body.package as ClinicalPackage);
    if (!ok) return reply.status(404).send({ success: false, error: 'Consult not found or expired' });
    return reply.send({ success: true, data: getConsultDetail(id) });
  });
}
