import type { FastifyInstance } from 'fastify';
import { validateToolsKey } from '../lib/beta-config.js';
import { betaEngine } from '../services/beta-engine.js';
import { betaStore } from '../services/beta-store.js';
import { toolsAssist, type AssistRequest, type ScanRequest } from '../services/tools-assist.js';
import {
  suggestProblems,
  interactionCheck,
  type PatientSnapshot,
  type InteractionCheckInput,
} from '../services/tools-clinical.js';
import { protocolStore, type HospitalProtocol } from '../services/protocol-store.js';
import { extractTextFromFile } from '../lib/extract-text.js';
import {
  generateDischargeSummary,
  generateReferralLetter,
  generateWardNote,
  generateAdmissionNote,
  interpretLabResults,
  generatePatientPresentation,
  generateObsNote,
  generateGynaeNote,
  generateRoundNote,
  type RoundNoteInput,
} from '../services/hospital-docs.js';

export async function toolsRoutes(app: FastifyInstance) {
  // Auth middleware helper
  function authTools(req: { headers: Record<string, unknown> }): boolean {
    const key = (req.headers['x-tools-key'] as string) ?? '';
    return validateToolsKey(key);
  }

  function unauth(reply: { status: (n: number) => { send: (d: unknown) => unknown } }) {
    return reply.status(401).send({ error: 'Invalid tools key' });
  }

  // Validate key
  app.post('/tools/validate', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    return reply.send({ valid: true });
  });

  // AI-assisted sequential logging: the AI asks one question at a time,
  // extracts structured field values from freeform answers, and prompts
  // for anything missed — instead of manual form filling.
  app.post('/tools/assist', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<AssistRequest>;
    if (!body.dept || !body.section || !Array.isArray(body.fields)) {
      return reply.status(400).send({ error: 'dept, section, and fields are required' });
    }
    try {
      const result = await toolsAssist.step({
        dept: body.dept,
        subDept: typeof body.subDept === 'string' ? body.subDept : undefined,
        section: body.section,
        fields: body.fields,
        transcript: Array.isArray(body.transcript) ? body.transcript : [],
        context: typeof body.context === 'string' ? body.context : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Assist request failed' });
    }
  });

  // Photo scan of handwritten notes: vision model reads the doctor's
  // handwriting, fills fields with per-field confidence, and flags what it
  // couldn't decipher so the intern (or the assist conversation) fills the gaps.
  app.post('/tools/scan-notes', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<ScanRequest>;
    if (!body.dept || !body.section || !Array.isArray(body.fields) || !body.imageBase64) {
      return reply.status(400).send({ error: 'dept, section, fields, and imageBase64 are required' });
    }
    const mediaType =
      body.mediaType === 'image/png' || body.mediaType === 'image/webp' ? body.mediaType : 'image/jpeg';
    try {
      const result = await toolsAssist.scanNotes({
        dept: body.dept,
        subDept: typeof body.subDept === 'string' ? body.subDept : undefined,
        section: body.section,
        fields: body.fields,
        imageBase64: body.imageBase64,
        mediaType,
        context: typeof body.context === 'string' ? body.context : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Scan request failed' });
    }
  });

  // AI problem list: STG-anchored management with a deterministic
  // interaction/allergy safety net over current meds + proposed plans.
  app.post('/tools/suggest-problems', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<PatientSnapshot>;
    if (!body.dept || !body.intake || !body.history || !body.assessment) {
      return reply.status(400).send({ error: 'dept, intake, history, and assessment are required' });
    }
    try {
      const result = await suggestProblems({
        dept: body.dept,
        intake: body.intake,
        history: body.history,
        assessment: body.assessment,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Problem suggestion failed' });
    }
  });

  // Deterministic polypharmacy + interaction check (no AI call).
  app.post('/tools/interaction-check', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = (req.body ?? {}) as InteractionCheckInput;
    return reply.send(interactionCheck(body));
  });

  // ─── Hospital protocols ────────────────────────────────────────────────────
  // A facility's own protocols, plugged in as a resource: uploaded once, then
  // retrieved (keyword match, same approach as STG retrieval) into every
  // assist conversation, photo scan, and problem-suggestion call for that
  // department — and instructed to override the generic SA STG where the two
  // disagree. In-memory only, same as the rest of the beta server's state.

  function protocolSummary(p: HospitalProtocol) {
    return {
      id: p.id,
      dept: p.dept,
      title: p.title,
      sourceFilename: p.sourceFilename,
      charCount: p.charCount,
      chunkCount: p.chunks.length,
      uploadedAt: p.uploadedAt,
    };
  }

  app.get('/tools/protocols', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const { dept } = req.query as { dept?: string };
    return reply.send({ protocols: protocolStore.list(dept).map(protocolSummary) });
  });

  // Paste-in text — always available, no file parsing required.
  app.post('/tools/protocols', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<{ dept: string; title: string; content: string }>;
    if (!body.dept || !body.title?.trim() || !body.content?.trim()) {
      return reply.status(400).send({ error: 'dept, title, and content are required' });
    }
    const protocol = protocolStore.add({ dept: body.dept, title: body.title.trim(), content: body.content });
    return reply.send(protocolSummary(protocol));
  });

  // File upload — PDF (parsed via pdf-parse) or plain text/markdown.
  app.post('/tools/protocols/upload', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    let dept = '';
    let title = '';
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';
    try {
      for await (const part of req.parts()) {
        if (part.type === 'file') {
          fileBuffer = await part.toBuffer();
          filename = part.filename;
          mimetype = part.mimetype;
        } else if (part.fieldname === 'dept') {
          dept = String(part.value);
        } else if (part.fieldname === 'title') {
          title = String(part.value);
        }
      }
    } catch (err) {
      app.log.error(err);
      return reply.status(400).send({ error: 'Failed to read the upload' });
    }
    if (!dept || !fileBuffer) {
      return reply.status(400).send({ error: 'dept and a file are required' });
    }
    try {
      const content = await extractTextFromFile(fileBuffer, filename, mimetype);
      if (!content.trim()) {
        return reply
          .status(422)
          .send({ error: 'Could not extract any text from that file — try pasting the text directly instead.' });
      }
      const protocol = protocolStore.add({
        dept,
        title: title.trim() || filename || 'Untitled protocol',
        content,
        sourceFilename: filename,
      });
      return reply.send(protocolSummary(protocol));
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to process the uploaded file' });
    }
  });

  app.delete('/tools/protocols/:id', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const { id } = req.params as { id: string };
    if (!protocolStore.remove(id)) return reply.status(404).send({ error: 'Protocol not found' });
    return reply.send({ removed: true });
  });

  // AI History session: start (for patient-facing URL)
  app.post('/tools/start-history', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as {
      department?: string;
      ageSex?: string;
      chiefComplaintHint?: string;
    };
    try {
      const { sessionId } = await betaEngine.startSession(
        body.department,
        body.ageSex,
        body.chiefComplaintHint
      );
      const patientUrl = `/?s=${sessionId}`;
      return reply.send({ sessionId, patientUrl });
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to start history session' });
    }
  });

  // Import completed history
  app.get('/tools/import-history/:sessionId', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const { sessionId } = req.params as { sessionId: string };
    const session = betaStore.get(sessionId);
    if (!session) return reply.status(404).send({ error: 'Session not found' });
    return reply.send({
      sessionId,
      completed: session.status === 'completed',
      summary: session.summary,
      complaints: session.complaints,
      history: session.history,
      messages: session.messages,
    });
  });

  // Ward round note
  app.post('/tools/round-note', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateRoundNote(req.body as RoundNoteInput);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate round note' });
    }
  });

  // Discharge summary
  app.post('/tools/discharge', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateDischargeSummary(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate discharge summary' });
    }
  });

  // Referral letter
  app.post('/tools/referral', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateReferralLetter(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate referral' });
    }
  });

  // Ward note
  app.post('/tools/ward-note', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateWardNote(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate ward note' });
    }
  });

  // Admission note
  app.post('/tools/admission-note', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateAdmissionNote(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate admission note' });
    }
  });

  // Lab interpretation
  app.post('/tools/interpret-labs', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await interpretLabResults(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to interpret labs' });
    }
  });

  // Patient presentation
  app.post('/tools/present-patient', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generatePatientPresentation(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate presentation' });
    }
  });

  // Obs note
  app.post('/tools/obs-note', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateObsNote(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate obs note' });
    }
  });

  // Gynae note
  app.post('/tools/gynae-note', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    try {
      const result = await generateGynaeNote(req.body as Record<string, unknown>);
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Failed to generate gynae note' });
    }
  });
}
