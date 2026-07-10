import type { FastifyInstance } from 'fastify';
import { validateToolsKey } from '../lib/beta-config.js';
import { betaEngine } from '../services/beta-engine.js';
import { betaStore } from '../services/beta-store.js';
import { toolsAssist, type AssistRequest, type ScanRequest, type QuickParseRequest } from '../services/tools-assist.js';
import {
  suggestProblems,
  interactionCheck,
  type PatientSnapshot,
  type InteractionCheckInput,
} from '../services/tools-clinical.js';
import { protocolStore, type HospitalProtocol } from '../services/protocol-store.js';
import { extractTextFromFile } from '../lib/extract-text.js';
import { analyzeClinicalImage, type ImageAnalysisRequest, type ImageModality } from '../services/image-analysis.js';
import { generateWardRoundDelta, type WardRoundDeltaRequest } from '../services/ward-round.js';
import { draftLegalForm, type LegalFormRequest } from '../services/clinical-forms.js';
import { screeningForProblems } from '../services/clinical-screening.js';
import { checkConsistency } from '../services/consistency.js';
import { usageStats, resetUsageStats } from '../lib/models.js';
import { generateWorkingPicture, type WorkingPictureRequest } from '../services/confidence-engine.js';
import { addFeedback, listFeedback, feedbackCount, type FeedbackEntry } from '../services/feedback-store.js';
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

  // Quick parse — the brain-dump fast path. One free-text (or dictated) dump →
  // every field extracted in a single call, no questions. ~1 round-trip vs ~6.
  app.post('/tools/quick-parse', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<QuickParseRequest>;
    if (!body.dept || !body.section || !Array.isArray(body.fields) || typeof body.text !== 'string' || !body.text.trim()) {
      return reply.status(400).send({ error: 'dept, section, fields, and non-empty text are required' });
    }
    try {
      const result = await toolsAssist.quickParse({
        dept: body.dept,
        subDept: typeof body.subDept === 'string' ? body.subDept : undefined,
        section: body.section,
        fields: body.fields,
        text: body.text,
        context: typeof body.context === 'string' ? body.context : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Quick parse failed' });
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

  // The bedside loop's brain: live weighted differential + discriminating
  // investigations; pass previousPicture and every confidence shift is narrated
  // against the new findings/results.
  app.post('/tools/working-picture', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<WorkingPictureRequest>;
    if (!body.dept || !body.intake || !body.history || !body.assessment) {
      return reply.status(400).send({ error: 'dept, intake, history, and assessment are required' });
    }
    try {
      const result = await generateWorkingPicture({
        dept: body.dept,
        subDept: body.subDept,
        intake: body.intake,
        history: body.history,
        assessment: body.assessment,
        problems: Array.isArray(body.problems) ? body.problems : undefined,
        resultsText: typeof body.resultsText === 'string' ? body.resultsText : undefined,
        previousPicture: body.previousPicture ?? null,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Working picture generation failed' });
    }
  });

  // Beta feedback — the intern's one-tap loop back from the ward. POST to file
  // a note; GET to read the last N (for me to triage into the backlog).
  app.post('/tools/feedback', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const b = (req.body ?? {}) as Partial<FeedbackEntry>;
    if (!b.note || !b.note.trim()) return reply.status(400).send({ error: 'note is required' });
    const entry = addFeedback(
      {
        screen: typeof b.screen === 'string' ? b.screen.slice(0, 60) : undefined,
        dept: typeof b.dept === 'string' ? b.dept : undefined,
        subDept: typeof b.subDept === 'string' ? b.subDept : undefined,
        rating: b.rating === 'good' || b.rating === 'bad' || b.rating === 'idea' ? b.rating : undefined,
        note: b.note.trim().slice(0, 2000),
        context: typeof b.context === 'string' ? b.context.slice(0, 1000) : undefined,
      },
      new Date().toISOString(),
    );
    return reply.send({ ok: true, id: entry.id });
  });

  app.get('/tools/feedback', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const limit = Math.min(Number((req.query as { limit?: string }).limit) || 100, 500);
    return reply.send({ count: feedbackCount(), entries: listFeedback(limit) });
  });

  // Model usage/cost telemetry — the eval harness reads this before/after a
  // clerking so cost-per-prompt is MEASURED against the <10c ceiling, not
  // guessed. In-memory; POST with {reset:true} zeroes the tally.
  app.post('/tools/usage-stats', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = (req.body ?? {}) as { reset?: boolean };
    if (body.reset) resetUsageStats();
    return reply.send(usageStats());
  });

  // Deterministic input-discrepancy check (no AI call) — the "alarmed
  // discrepancy" net. Instant, so the client can run it as the intern types.
  // Flags misplaced/contradictory/implausible input; never blocks.
  app.post('/tools/check-consistency', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = (req.body ?? {}) as { record?: Record<string, string | undefined>; subDept?: string };
    return reply.send({ discrepancies: checkConsistency({ record: body.record ?? {}, subDept: body.subDept }) });
  });

  // Multimodal clinical image analysis: ECG/CTG/CXR/US/... via one vision
  // engine with modality-specific extraction frames. injectText goes straight
  // into the clinical record.
  app.post('/tools/analyze-image', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<ImageAnalysisRequest>;
    if (!body.dept || !body.modality || !body.imageBase64) {
      return reply.status(400).send({ error: 'dept, modality, and imageBase64 are required' });
    }
    const mediaType =
      body.mediaType === 'image/png' || body.mediaType === 'image/webp' ? body.mediaType : 'image/jpeg';
    try {
      const result = await analyzeClinicalImage({
        dept: body.dept,
        subDept: typeof body.subDept === 'string' ? body.subDept : undefined,
        modality: body.modality as ImageModality,
        imageBase64: body.imageBase64,
        mediaType,
        context: typeof body.context === 'string' ? body.context : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Image analysis failed' });
    }
  });

  // Ward-round delta engine: today's round computed against the trajectory of
  // prior rounds, with deterministic safety + screening post-passes.
  app.post('/tools/ward-round-delta', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<WardRoundDeltaRequest>;
    if (!body.dept || typeof body.patientContext !== 'string' || !Array.isArray(body.problems)) {
      return reply.status(400).send({ error: 'dept, patientContext, and problems are required' });
    }
    try {
      const result = await generateWardRoundDelta({
        dept: body.dept,
        subDept: typeof body.subDept === 'string' ? body.subDept : undefined,
        patientContext: body.patientContext,
        problems: body.problems,
        medications: typeof body.medications === 'string' ? body.medications : undefined,
        allergies: typeof body.allergies === 'string' ? body.allergies : undefined,
        previousRounds: Array.isArray(body.previousRounds) ? body.previousRounds : [],
        todaySubjective: typeof body.todaySubjective === 'string' ? body.todaySubjective : undefined,
        todayObjective: typeof body.todayObjective === 'string' ? body.todayObjective : undefined,
        vitals: typeof body.vitals === 'string' ? body.vitals : undefined,
        newResults: typeof body.newResults === 'string' ? body.newResults : undefined,
        imageFindings: Array.isArray(body.imageFindings) ? body.imageFindings : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Ward round synthesis failed' });
    }
  });

  // Deterministic problem-linked screening rules (no AI call) — the client
  // refreshes these whenever the active problem list changes.
  app.post('/tools/screening', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<{ problems: string[] }>;
    if (!Array.isArray(body.problems)) {
      return reply.status(400).send({ error: 'problems (string[]) is required' });
    }
    return reply.send({ screening: screeningForProblems(body.problems) });
  });

  // Statutory/legal form drafting: MHCA 72-hr assessment, J88, surgical consent.
  app.post('/tools/legal-form', async (req, reply) => {
    if (!authTools(req)) return unauth(reply);
    const body = req.body as Partial<LegalFormRequest>;
    const validTypes = ['mhca-72hr', 'j88', 'surgical-consent'];
    if (!body.formType || !validTypes.includes(body.formType) || !body.dept || !body.patientRecord) {
      return reply.status(400).send({ error: 'formType (mhca-72hr|j88|surgical-consent), dept, and patientRecord are required' });
    }
    try {
      const result = await draftLegalForm({
        formType: body.formType,
        dept: body.dept,
        patientRecord: body.patientRecord as Record<string, unknown>,
        context: typeof body.context === 'string' ? body.context : undefined,
      });
      return reply.send(result);
    } catch (err) {
      app.log.error(err);
      return reply.status(500).send({ error: 'Form drafting failed' });
    }
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
    const session = await betaStore.load(sessionId);
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
