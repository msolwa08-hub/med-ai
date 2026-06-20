// Personal intern tools API — gated by a personal tools key (separate from the
// patient access key and the doctor cockpit key). Stateless: takes the doctor's
// inputs, returns a DRAFT hospital document for them to review/edit/sign.

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { betaConfig } from '../lib/beta-config.js';
import {
  generateDischargeSummary,
  generateReferralLetter,
  generateWardNote,
} from '../services/hospital-docs.js';

const DischargeSchema = z.object({
  ageSex: z.string().optional(),
  hospitalNumber: z.string().optional(),
  ward: z.string().optional(),
  admissionDate: z.string().optional(),
  dischargeDate: z.string().optional(),
  primaryDiagnosis: z.string().optional(),
  notes: z.string().min(1, 'notes are required'),
});

const ReferralSchema = z.object({
  ageSex: z.string().optional(),
  hospitalNumber: z.string().optional(),
  referTo: z.string().min(1, 'referTo is required'),
  urgency: z.enum(['ROUTINE', 'URGENT', 'EMERGENCY']).optional(),
  specificQuestion: z.string().optional(),
  notes: z.string().min(1, 'notes are required'),
});

const WardNoteSchema = z.object({
  ageSex: z.string().optional(),
  hospitalNumber: z.string().optional(),
  ward: z.string().optional(),
  hospitalDay: z.string().optional(),
  workingDiagnosis: z.string().optional(),
  previousNotes: z.string().min(1, 'previousNotes are required'),
  labResults: z.string().optional(),
  todayStatus: z.string().optional(),
});

function toolsKeys(): string[] {
  return (betaConfig.BETA_TOOLS_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}
function isValidToolsKey(key: string | undefined): boolean {
  return !!key && toolsKeys().includes(key);
}
function requireTools(request: FastifyRequest, reply: FastifyReply): boolean {
  const key = request.headers['x-tools-key'];
  const value = Array.isArray(key) ? key[0] : key;
  if (!isValidToolsKey(value)) {
    reply.status(401).send({ success: false, error: 'Invalid or missing tools key' });
    return false;
  }
  return true;
}

export async function toolsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/tools/validate', async (request, reply) => {
    const body = request.body as { toolsKey?: string } | undefined;
    return reply.send({ success: true, data: { valid: isValidToolsKey(body?.toolsKey) } });
  });

  fastify.post('/tools/discharge', async (request, reply) => {
    if (!requireTools(request, reply)) return;
    const parsed = DischargeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.flatten() });
    }
    try {
      const doc = await generateDischargeSummary(parsed.data);
      return reply.send({ success: true, data: { document: doc } });
    } catch (err) {
      fastify.log.error(err, 'tools: discharge generation failed');
      return reply.status(500).send({ success: false, error: 'Failed to generate discharge summary' });
    }
  });

  fastify.post('/tools/referral', async (request, reply) => {
    if (!requireTools(request, reply)) return;
    const parsed = ReferralSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.flatten() });
    }
    try {
      const doc = await generateReferralLetter(parsed.data);
      return reply.send({ success: true, data: { document: doc } });
    } catch (err) {
      fastify.log.error(err, 'tools: referral generation failed');
      return reply.status(500).send({ success: false, error: 'Failed to generate referral letter' });
    }
  });

  fastify.post('/tools/ward-note', async (request, reply) => {
    if (!requireTools(request, reply)) return;
    const parsed = WardNoteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', details: parsed.error.flatten() });
    }
    try {
      const doc = await generateWardNote(parsed.data);
      return reply.send({ success: true, data: { document: doc } });
    } catch (err) {
      fastify.log.error(err, 'tools: ward-note generation failed');
      return reply.status(500).send({ success: false, error: 'Failed to generate ward note' });
    }
  });
}
