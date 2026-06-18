/**
 * South African Laboratory Integration Service
 *
 * Integrates with the three major SA private laboratory providers:
 *   - Lancet Laboratories (HL7 FHIR R4)
 *   - Ampath National Laboratories (Ampath portal / webhook)
 *   - Lab24 (HL7 v2.x message format)
 *
 * Architecture:
 *   - Outbound: Request lab tests via provider-specific APIs
 *   - Inbound: Receive results via webhook callbacks
 *   - Storage: Results stored encrypted per consultation
 *   - Normalisation: All results normalised to ParsedLabResult
 *
 * In production, replace mock implementations with live API calls
 * and configure provider credentials in environment variables.
 */

import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { encryptJSON, decryptJSON } from '../lib/encryption.js';
import { config } from '../config.js';

// ============================================================
// Types
// ============================================================

export type LabProvider = 'LANCET' | 'AMPATH' | 'LAB24';

export interface PatientLabAccount {
  patientId: string;
  provider: LabProvider;
  externalPatientId: string; // Provider's patient identifier
  labNumber?: string;         // Current lab order number
  linkedAt: string;
}

export interface LabResult {
  id: string;
  consultationId: string;
  patientId: string;
  provider: LabProvider;
  orderId: string;           // Provider order/accession number
  testName: string;
  testCode: string;          // LOINC or provider-specific code
  status: 'PENDING' | 'PARTIAL' | 'FINAL' | 'CORRECTED' | 'CANCELLED';
  orderedAt: string;
  reportedAt?: string;
  rawPayload: string;        // Encrypted original provider payload
  parsedResults: ParsedLabResult[];
}

export interface ParsedLabResult {
  analyte: string;            // Test name (e.g. "Haemoglobin")
  value: string;              // Result value (e.g. "12.5")
  unit: string;               // (e.g. "g/dL")
  referenceRange?: string;    // (e.g. "13.0-17.0")
  flag?: 'H' | 'L' | 'HH' | 'LL' | 'N'; // High/Low/Critical High/Critical Low/Normal
  status: 'FINAL' | 'PRELIMINARY' | 'CORRECTED';
  loincCode?: string;
}

export interface FormattedLabResult {
  consultationId: string;
  provider: LabProvider;
  providerOrderId: string;
  reportDate?: string;
  status: LabResult['status'];
  patient: {
    id: string;
    externalId: string;
  };
  results: Array<{
    test: string;
    value: string;
    unit: string;
    referenceRange?: string;
    flag?: string;
    flagLabel?: string;
    isCritical: boolean;
    isAbnormal: boolean;
    loincCode?: string;
  }>;
  criticalValues: ParsedLabResult[]; // Values requiring immediate clinician action
  summary: string;
  rawProvider: LabProvider;
}

export interface LabOrderRequest {
  consultationId: string;
  patientId: string;
  tests: LabTestRequest[];
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  clinicalNotes?: string;
  doctorUserId: string;
  preferredProvider?: LabProvider;
}

export interface LabTestRequest {
  testName: string;
  loincCode?: string;
  providerTestCode?: string; // Provider-specific code if known
}

export interface LabOrderResponse {
  success: boolean;
  provider: LabProvider;
  orderId: string;
  barcode?: string;           // Specimen barcode
  collectionPoint?: string;   // Nearest collection point
  estimatedTurnaround: string;
  instructions?: string;
  error?: string;
}

export interface WebhookPayload {
  provider: LabProvider;
  signature: string;          // HMAC signature for verification
  timestamp: string;
  data: unknown;
}

// ============================================================
// Common SA Lab Tests (LOINC mapping)
// ============================================================

const SA_COMMON_TESTS: Record<string, { loinc: string; lancetCode: string; ampathCode: string; lab24Code: string }> = {
  'Full Blood Count': { loinc: '58410-2', lancetCode: 'FBC', ampathCode: 'FBC', lab24Code: 'CBC' },
  'CD4 Count': { loinc: '24467-3', lancetCode: 'CD4', ampathCode: 'CD4ABS', lab24Code: 'CD4' },
  'HIV Viral Load': { loinc: '20447-9', lancetCode: 'HIVVL', ampathCode: 'HIVRNA', lab24Code: 'VL' },
  'Creatinine': { loinc: '2160-0', lancetCode: 'CREAT', ampathCode: 'CREAT', lab24Code: 'CREAT' },
  'eGFR': { loinc: '33914-3', lancetCode: 'EGFR', ampathCode: 'eGFR', lab24Code: 'EGFR' },
  'HbA1c': { loinc: '4548-4', lancetCode: 'HBA1C', ampathCode: 'GLYCHB', lab24Code: 'HBA1C' },
  'Fasting Glucose': { loinc: '1558-6', lancetCode: 'GLUFAST', ampathCode: 'GLUF', lab24Code: 'FPG' },
  'Total Cholesterol': { loinc: '2093-3', lancetCode: 'CHOL', ampathCode: 'CHOL', lab24Code: 'CHOL' },
  'LDL Cholesterol': { loinc: '2089-1', lancetCode: 'LDL', ampathCode: 'LDL', lab24Code: 'LDL' },
  'GeneXpert MTB/RIF': { loinc: '88194-4', lancetCode: 'GXPERT', ampathCode: 'XPERT', lab24Code: 'GXPERT' },
  'Sputum Smear': { loinc: '11545-1', lancetCode: 'SMMICRO', ampathCode: 'AFB', lab24Code: 'AFB' },
  'Liver Function Tests': { loinc: '24325-3', lancetCode: 'LFT', ampathCode: 'LFTS', lab24Code: 'LFT' },
  'TSH': { loinc: '3016-3', lancetCode: 'TSH', ampathCode: 'TSH', lab24Code: 'TSH' },
  'RPR (Syphilis)': { loinc: '31147-2', lancetCode: 'RPR', ampathCode: 'RPR', lab24Code: 'RPRQ' },
  'Urine Dipstick': { loinc: '24357-6', lancetCode: 'URINDIP', ampathCode: 'UDIP', lab24Code: 'UA' },
  'Urine MCS': { loinc: '630-4', lancetCode: 'URINMCS', ampathCode: 'UMCS', lab24Code: 'UMCS' },
  'Blood Culture': { loinc: '600-7', lancetCode: 'BLDCX', ampathCode: 'BLDCX', lab24Code: 'BLDC' },
  'CRP': { loinc: '1988-5', lancetCode: 'CRP', ampathCode: 'CRP', lab24Code: 'CRP' },
  'Uric Acid': { loinc: '3084-1', lancetCode: 'URIC', ampathCode: 'URATE', lab24Code: 'URIC' },
  'Cryptococcal Antigen (CrAg)': { loinc: '92380-6', lancetCode: 'CRAG', ampathCode: 'CRYPTAG', lab24Code: 'CRAG' },
};

// Critical value thresholds (values requiring immediate clinician notification)
const CRITICAL_FLAGS = ['HH', 'LL'];

// ============================================================
// Lab Order Placement
// ============================================================

/**
 * Place a lab order with the appropriate provider
 */
export async function placeLabOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
  const provider = request.preferredProvider ?? selectBestProvider(request);

  switch (provider) {
    case 'LANCET':
      return placeLancetOrder(request);
    case 'AMPATH':
      return placeAmpathOrder(request);
    case 'LAB24':
      return placeLab24Order(request);
  }
}

/**
 * Select the best provider based on availability and test coverage
 */
function selectBestProvider(request: LabOrderRequest): LabProvider {
  // Check if request includes TB-specific tests (Ampath is government-partnered)
  const hasTBTest = request.tests.some(
    (t) => t.testName.toLowerCase().includes('genexpert') || t.testName.toLowerCase().includes('sputum')
  );
  if (hasTBTest) return 'AMPATH';

  // HIV viral load — Lancet preferred for private, Ampath for public
  const hasVLTest = request.tests.some((t) => t.testName.toLowerCase().includes('viral load'));
  if (hasVLTest) return 'LANCET';

  // Default to Lancet for most private lab work
  return 'LANCET';
}

// ============================================================
// Provider: Lancet Laboratories (FHIR R4)
// ============================================================

async function placeLancetOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
  // In production: POST to Lancet FHIR ServiceRequest endpoint
  // https://fhir.lancet.co.za/r4/ServiceRequest
  //
  // For now, generate a realistic mock response

  const orderId = `LNC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const barcode = `LNC${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;

  // Store pending order in DB
  await storePendingOrder(request, 'LANCET', orderId);

  return {
    success: true,
    provider: 'LANCET',
    orderId,
    barcode,
    collectionPoint: 'Lancet Laboratory — nearest collection point will be SMS\'d to patient',
    estimatedTurnaround: request.priority === 'STAT' ? '2-4 hours' : request.priority === 'URGENT' ? '4-8 hours' : '24-48 hours',
    instructions: 'Patient must fast for 8 hours before blood glucose, lipogram, and liver function tests. Bring ID and medical aid card.',
  };
}

/**
 * Parse Lancet FHIR R4 DiagnosticReport into ParsedLabResult[]
 */
export function parseLancetFHIRResult(fhirPayload: unknown): ParsedLabResult[] {
  const report = fhirPayload as Record<string, unknown>;
  const results: ParsedLabResult[] = [];

  // FHIR DiagnosticReport contains Observation resources
  const contained = report.contained as unknown[] ?? [];

  for (const resource of contained) {
    const obs = resource as Record<string, unknown>;
    if ((obs.resourceType as string) !== 'Observation') continue;

    const code = (obs.code as Record<string, unknown>)?.coding as unknown[];
    const valueQuantity = obs.valueQuantity as Record<string, unknown> | undefined;
    const interpretation = obs.interpretation as unknown[] | undefined;

    if (!valueQuantity) continue;

    const analyte = (code?.[0] as Record<string, unknown>)?.display as string ?? 'Unknown';
    const value = String(valueQuantity.value ?? '');
    const unit = String(valueQuantity.unit ?? '');
    const loincCode = (code?.[0] as Record<string, unknown>)?.code as string | undefined;

    const referenceRange = extractFHIRReferenceRange(obs.referenceRange as unknown[]);
    const flag = extractFHIRFlag(interpretation);

    results.push({ analyte, value, unit, referenceRange, flag, status: 'FINAL', loincCode });
  }

  return results;
}

function extractFHIRReferenceRange(ranges: unknown[] | undefined): string | undefined {
  if (!ranges?.length) return undefined;
  const range = ranges[0] as Record<string, unknown>;
  const low = (range.low as Record<string, unknown>)?.value;
  const high = (range.high as Record<string, unknown>)?.value;
  if (low !== undefined && high !== undefined) return `${low}-${high}`;
  return undefined;
}

function extractFHIRFlag(
  interpretation: unknown[] | undefined
): ParsedLabResult['flag'] | undefined {
  if (!interpretation?.length) return undefined;
  const coding = (interpretation[0] as Record<string, unknown>)?.coding as unknown[];
  const code = (coding?.[0] as Record<string, unknown>)?.code as string | undefined;
  if (!code) return undefined;
  const flagMap: Record<string, ParsedLabResult['flag']> = {
    H: 'H', L: 'L', HH: 'HH', LL: 'LL', N: 'N',
    'H*': 'HH', 'L*': 'LL',
  };
  return flagMap[code];
}

// ============================================================
// Provider: Ampath National Laboratories
// ============================================================

async function placeAmpathOrder(request: LabOrderRequest): Promise<LabOrderResponse> {
  // In production: POST to Ampath's lab portal API
  // Ampath integrates heavily with the SA National Health Laboratory Service (NHLS)

  const orderId = `AMP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const barcode = `AMP${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;

  await storePendingOrder(request, 'AMPATH', orderId);

  return {
    success: true,
    provider: 'AMPATH',
    orderId,
    barcode,
    collectionPoint: 'Ampath Collection Centre — visit ampath.co.za/find-lab for nearest location',
    estimatedTurnaround: request.priority === 'STAT' ? '3-6 hours' : '24-72 hours',
    instructions: 'GeneXpert and sputum tests: please cough deeply before producing specimen. Avoid food/water 2 hours before sputum collection.',
  };
}

/**
 * Parse Ampath result message (JSON format from their API)
 */
export function parseAmpathResult(ampathPayload: unknown): ParsedLabResult[] {
  const payload = ampathPayload as Record<string, unknown>;
  const results: ParsedLabResult[] = [];

  // Ampath returns results in a JSON array under 'observations'
  const observations = payload.observations as unknown[] ?? [];

  for (const obs of observations) {
    const o = obs as Record<string, unknown>;
    results.push({
      analyte: String(o.testName ?? o.test_name ?? 'Unknown'),
      value: String(o.result ?? o.value ?? ''),
      unit: String(o.unit ?? o.units ?? ''),
      referenceRange: o.referenceRange as string | undefined ?? o.reference_range as string | undefined,
      flag: parseAmpathFlag(o.flag as string | undefined ?? o.interpretation as string | undefined),
      status: (o.resultStatus as string ?? 'FINAL') as ParsedLabResult['status'],
      loincCode: o.loincCode as string | undefined ?? o.loinc as string | undefined,
    });
  }

  return results;
}

function parseAmpathFlag(flag: string | undefined): ParsedLabResult['flag'] | undefined {
  if (!flag) return undefined;
  const upper = flag.toUpperCase().trim();
  const flagMap: Record<string, ParsedLabResult['flag']> = {
    'H': 'H', 'HIGH': 'H',
    'L': 'L', 'LOW': 'L',
    'HH': 'HH', 'CRITICAL HIGH': 'HH', 'CH': 'HH',
    'LL': 'LL', 'CRITICAL LOW': 'LL', 'CL': 'LL',
    'N': 'N', 'NORMAL': 'N', 'WNL': 'N',
  };
  return flagMap[upper];
}

// ============================================================
// Provider: Lab24
// ============================================================

async function placeLab24Order(request: LabOrderRequest): Promise<LabOrderResponse> {
  // In production: POST to Lab24 API endpoint
  // Lab24 uses a combination of FHIR and HL7 v2.x

  const orderId = `L24-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const barcode = `L24${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`;

  await storePendingOrder(request, 'LAB24', orderId);

  return {
    success: true,
    provider: 'LAB24',
    orderId,
    barcode,
    collectionPoint: 'Lab24 — contact 0861 LAB24S (0861 522247) for collection appointment',
    estimatedTurnaround: request.priority === 'STAT' ? '2-4 hours' : '24-48 hours',
    instructions: 'Fasting required for lipogram and glucose. Blood culture: collect before antibiotics if possible.',
  };
}

/**
 * Parse Lab24 HL7 v2.x ORU message into ParsedLabResult[]
 */
export function parseLab24HL7Result(hl7Message: string): ParsedLabResult[] {
  const results: ParsedLabResult[] = [];

  // HL7 v2.x ORU^R01 message parsing
  // Format: field separator is |, component separator is ^
  const segments = hl7Message.split('\r').filter((s) => s.trim());

  for (const segment of segments) {
    if (!segment.startsWith('OBX')) continue;

    const fields = segment.split('|');
    // OBX-3: Observation Identifier
    // OBX-5: Observation Value
    // OBX-6: Units
    // OBX-7: Reference Range
    // OBX-8: Abnormal Flags
    // OBX-11: Observation Result Status

    const identifier = fields[3] ?? '';
    const value = fields[5] ?? '';
    const unit = fields[6] ?? '';
    const referenceRange = fields[7] || undefined;
    const flagStr = fields[8] ?? '';
    const statusStr = fields[11] ?? 'F';

    // OBX-3 format: code^description^coding_system
    const idParts = identifier.split('^');
    const loincCode = idParts[0] ?? undefined;
    const analyte = idParts[1] ?? 'Unknown Test';

    const flag = parseHL7Flag(flagStr);
    const status = parseHL7Status(statusStr);

    if (analyte && value) {
      results.push({ analyte, value, unit, referenceRange, flag, status, loincCode });
    }
  }

  return results;
}

function parseHL7Flag(flag: string): ParsedLabResult['flag'] | undefined {
  const flagMap: Record<string, ParsedLabResult['flag']> = {
    'H': 'H', 'L': 'L', 'HH': 'HH', 'LL': 'LL', 'N': 'N', 'A': 'H',
  };
  return flagMap[flag.trim().toUpperCase()];
}

function parseHL7Status(status: string): ParsedLabResult['status'] {
  const statusMap: Record<string, ParsedLabResult['status']> = {
    'F': 'FINAL', 'P': 'PRELIMINARY', 'C': 'CORRECTED',
  };
  return statusMap[status.trim().toUpperCase()] ?? 'FINAL';
}

// ============================================================
// Webhook Receiver
// ============================================================

/**
 * Process incoming lab result webhook from any provider
 * Called by the webhook route handler
 */
export async function processLabResultWebhook(
  webhookPayload: WebhookPayload
): Promise<{ processed: boolean; consultationId?: string; criticalValues?: ParsedLabResult[] }> {
  // Verify webhook signature
  if (!verifyWebhookSignature(webhookPayload)) {
    console.warn('[Lab] Invalid webhook signature from provider:', webhookPayload.provider);
    return { processed: false };
  }

  let parsedResults: ParsedLabResult[] = [];
  let orderId = '';
  let patientExternalId = '';

  // Parse based on provider
  switch (webhookPayload.provider) {
    case 'LANCET': {
      parsedResults = parseLancetFHIRResult(webhookPayload.data);
      const data = webhookPayload.data as Record<string, unknown>;
      orderId = String(data.id ?? data.accessionNumber ?? '');
      patientExternalId = extractLancetPatientId(webhookPayload.data);
      break;
    }
    case 'AMPATH': {
      parsedResults = parseAmpathResult(webhookPayload.data);
      const data = webhookPayload.data as Record<string, unknown>;
      orderId = String(data.orderId ?? data.order_id ?? '');
      patientExternalId = String(data.patientId ?? data.patient_id ?? '');
      break;
    }
    case 'LAB24': {
      const data = webhookPayload.data as Record<string, unknown>;
      const hl7 = data.hl7Message as string ?? data.message as string ?? '';
      parsedResults = parseLab24HL7Result(hl7);
      orderId = String(data.orderId ?? '');
      patientExternalId = String(data.pid ?? '');
      break;
    }
  }

  // Look up the consultation from the order
  const pendingOrder = await lookupPendingOrder(orderId, webhookPayload.provider);
  if (!pendingOrder) {
    console.warn('[Lab] No pending order found for:', orderId, webhookPayload.provider);
    return { processed: false };
  }

  // Identify critical values
  const criticalValues = parsedResults.filter(
    (r) => r.flag && CRITICAL_FLAGS.includes(r.flag)
  );

  // Encrypt and store results
  const encryptedPayload = encryptJSON(webhookPayload.data);
  const labResult: LabResult = {
    id: crypto.randomUUID(),
    consultationId: pendingOrder.consultationId,
    patientId: pendingOrder.patientId,
    provider: webhookPayload.provider,
    orderId,
    testName: 'Lab Panel',
    testCode: orderId,
    status: criticalValues.length > 0 ? 'FINAL' : 'FINAL',
    orderedAt: pendingOrder.orderedAt,
    reportedAt: new Date().toISOString(),
    rawPayload: encryptedPayload,
    parsedResults,
  };

  await storeLabResult(labResult);

  // Notify doctor of critical values
  if (criticalValues.length > 0) {
    await notifyDoctorCriticalValues(pendingOrder.consultationId, criticalValues, webhookPayload.provider);
  }

  console.info(`[Lab] Processed ${parsedResults.length} results for consultation ${pendingOrder.consultationId}`);

  return {
    processed: true,
    consultationId: pendingOrder.consultationId,
    criticalValues: criticalValues.length > 0 ? criticalValues : undefined,
  };
}

function verifyWebhookSignature(payload: WebhookPayload): boolean {
  try {
    const secret = (config as Record<string, string>)[`${payload.provider}_WEBHOOK_SECRET`]
      ?? (config as Record<string, string>).LAB_WEBHOOK_SECRET
      ?? config.ENCRYPTION_KEY;

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${payload.timestamp}:${JSON.stringify(payload.data)}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(payload.signature, 'hex'),
      Buffer.from(expectedSig, 'hex')
    );
  } catch {
    return false;
  }
}

// ============================================================
// Result Formatting
// ============================================================

/**
 * Format lab results for display in the consultation view
 */
export function formatLabResultsForDisplay(labResult: LabResult): FormattedLabResult {
  const formatted = labResult.parsedResults.map((r) => ({
    test: r.analyte,
    value: r.value,
    unit: r.unit,
    referenceRange: r.referenceRange,
    flag: r.flag,
    flagLabel: getFlagLabel(r.flag),
    isCritical: r.flag !== undefined && CRITICAL_FLAGS.includes(r.flag),
    isAbnormal: r.flag !== undefined && r.flag !== 'N',
    loincCode: r.loincCode,
  }));

  const criticalValues = labResult.parsedResults.filter(
    (r) => r.flag && CRITICAL_FLAGS.includes(r.flag)
  );

  const abnormalCount = formatted.filter((r) => r.isAbnormal).length;
  const criticalCount = formatted.filter((r) => r.isCritical).length;

  let summary = `${formatted.length} test(s) reported`;
  if (criticalCount > 0) summary += ` — ⚠️ ${criticalCount} CRITICAL value(s) require immediate action`;
  else if (abnormalCount > 0) summary += ` — ${abnormalCount} abnormal result(s)`;
  else summary += ' — All results within normal limits';

  return {
    consultationId: labResult.consultationId,
    provider: labResult.provider,
    providerOrderId: labResult.orderId,
    reportDate: labResult.reportedAt,
    status: labResult.status,
    patient: {
      id: labResult.patientId,
      externalId: labResult.orderId,
    },
    results: formatted,
    criticalValues,
    summary,
    rawProvider: labResult.provider,
  };
}

function getFlagLabel(flag: ParsedLabResult['flag']): string | undefined {
  const labels: Record<string, string> = {
    H: 'HIGH', L: 'LOW',
    HH: 'CRITICAL HIGH', LL: 'CRITICAL LOW',
    N: 'Normal',
  };
  return flag ? labels[flag] : undefined;
}

// ============================================================
// Retrieval
// ============================================================

/**
 * Get all lab results for a consultation
 */
export async function getConsultationLabResults(
  consultationId: string
): Promise<FormattedLabResult[]> {
  const rawResults = await (prisma as unknown as Record<string, unknown>)
    .labResult?.findMany?.({
      where: { consultationId },
      orderBy: { reportedAt: 'desc' },
    }) as unknown[] | undefined;

  if (!rawResults?.length) return [];

  return rawResults.map((raw) => {
    const r = raw as LabResult;
    // Decrypt the stored results
    try {
      const decryptedParsed = decryptJSON(r.rawPayload);
      const fullResult: LabResult = {
        ...r,
        parsedResults: r.parsedResults ?? [],
      };
      return formatLabResultsForDisplay(fullResult);
    } catch {
      return formatLabResultsForDisplay(r);
    }
  });
}

/**
 * Get lab results for a patient across all consultations
 */
export async function getPatientLabHistory(
  patientId: string,
  limit = 50
): Promise<FormattedLabResult[]> {
  const rawResults = await (prisma as unknown as Record<string, unknown>)
    .labResult?.findMany?.({
      where: { patientId },
      orderBy: { reportedAt: 'desc' },
      take: limit,
    }) as unknown[] | undefined;

  if (!rawResults?.length) return [];

  return rawResults.map((raw) => formatLabResultsForDisplay(raw as LabResult));
}

/**
 * Get pending (awaited) lab orders for a consultation
 */
export async function getPendingLabOrders(consultationId: string): Promise<Array<{
  orderId: string;
  provider: LabProvider;
  orderedAt: string;
  tests: string[];
  priority: string;
}>> {
  const orders = await (prisma as unknown as Record<string, unknown>)
    .pendingLabOrder?.findMany?.({
      where: { consultationId, status: 'PENDING' },
    }) as unknown[] | undefined;

  return (orders ?? []).map((o) => {
    const order = o as Record<string, unknown>;
    return {
      orderId: String(order.orderId ?? ''),
      provider: String(order.provider ?? 'LANCET') as LabProvider,
      orderedAt: String(order.orderedAt ?? ''),
      tests: (order.tests as string[]) ?? [],
      priority: String(order.priority ?? 'ROUTINE'),
    };
  });
}

// ============================================================
// Private Helpers
// ============================================================

async function storePendingOrder(
  request: LabOrderRequest,
  provider: LabProvider,
  orderId: string
): Promise<void> {
  try {
    await (prisma as unknown as Record<string, { create: (args: unknown) => Promise<unknown> }>)
      .pendingLabOrder?.create?.({
        data: {
          orderId,
          consultationId: request.consultationId,
          patientId: request.patientId,
          provider,
          tests: request.tests.map((t) => t.testName),
          priority: request.priority,
          status: 'PENDING',
          orderedAt: new Date().toISOString(),
          orderedBy: request.doctorUserId,
        },
      });
  } catch (err) {
    // If table doesn't exist yet (migration pending), log and continue
    console.warn('[Lab] Could not store pending order (migration may be pending):', err);
  }
}

async function lookupPendingOrder(
  orderId: string,
  provider: LabProvider
): Promise<{ consultationId: string; patientId: string; orderedAt: string } | null> {
  try {
    const order = await (prisma as unknown as Record<string, unknown>)
      .pendingLabOrder?.findFirst?.({
        where: { orderId, provider },
      }) as Record<string, unknown> | null | undefined;

    if (!order) return null;
    return {
      consultationId: String(order.consultationId ?? ''),
      patientId: String(order.patientId ?? ''),
      orderedAt: String(order.orderedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

async function storeLabResult(result: LabResult): Promise<void> {
  try {
    await (prisma as unknown as Record<string, { upsert: (args: unknown) => Promise<unknown> }>)
      .labResult?.upsert?.({
        where: { id: result.id },
        create: result,
        update: {
          status: result.status,
          parsedResults: result.parsedResults,
          rawPayload: result.rawPayload,
          reportedAt: result.reportedAt,
        },
      });
  } catch (err) {
    console.error('[Lab] Failed to store lab result:', err);
  }
}

async function notifyDoctorCriticalValues(
  consultationId: string,
  criticalValues: ParsedLabResult[],
  provider: LabProvider
): Promise<void> {
  const criticalList = criticalValues
    .map((v) => `${v.analyte}: ${v.value} ${v.unit} [${v.flag}]`)
    .join(', ');

  console.warn(
    `[Lab] CRITICAL VALUES for consultation ${consultationId} from ${provider}: ${criticalList}`
  );

  // In production: trigger SMS/push notification to doctor via SMS service
  // await sendSMS(doctorPhone, `CRITICAL LAB VALUES: ${criticalList}. Please review immediately.`);
}

function extractLancetPatientId(fhirPayload: unknown): string {
  const report = fhirPayload as Record<string, unknown>;
  const subject = report.subject as Record<string, unknown> | undefined;
  if (subject?.reference) {
    const ref = String(subject.reference);
    return ref.replace('Patient/', '');
  }
  return '';
}

/**
 * Get test code for a provider
 */
export function getProviderTestCode(testName: string, provider: LabProvider): string {
  const test = SA_COMMON_TESTS[testName];
  if (!test) return testName;
  switch (provider) {
    case 'LANCET': return test.lancetCode;
    case 'AMPATH': return test.ampathCode;
    case 'LAB24': return test.lab24Code;
  }
}

/**
 * List all available SA common tests with LOINC codes
 */
export function listAvailableTests(): Array<{ name: string; loincCode: string; providers: LabProvider[] }> {
  return Object.entries(SA_COMMON_TESTS).map(([name, codes]) => ({
    name,
    loincCode: codes.loinc,
    providers: ['LANCET', 'AMPATH', 'LAB24'] as LabProvider[],
  }));
}
