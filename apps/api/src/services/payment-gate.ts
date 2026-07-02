/**
 * Payment Gate — the marketplace's single enforcement point.
 *
 * Where it sits in the lifecycle (deliberately late):
 *
 *   create → AI history → triage → dispatch → accept → examine → reason
 *   → diagnose ............................................ never gated
 *   → PRESCRIPTION ISSUANCE / CONSULTATION COMPLETION ...... gated here
 *
 * Rationale: a medical marketplace must never let billing block care — a
 * patient in trouble gets triaged, dispatched and assessed regardless. What
 * payment unlocks are the billable deliverables at the end of the visit.
 *
 * Exemptions, in order of checking:
 *   1. PAYMENT_ENFORCEMENT off (closed-server practices bill off-platform)
 *   2. EMERGENCY triage — never hold an emergency hostage to a card
 *   3. Doctor has no fee set — nothing to collect
 *
 * A blocked call gets a 402 with the current payment status so the client
 * can route straight to the payment screen (or the doctor can record a cash
 * / medical-aid payment via POST /payments/cash/:consultationId).
 */

import prisma from '../lib/prisma.js';
import { config } from '../config.js';

export interface PaymentGateResult {
  allowed: boolean;
  /** Why the gate passed/failed — for audit metadata and client messaging. */
  reason:
    | 'ENFORCEMENT_OFF'
    | 'EMERGENCY_EXEMPT'
    | 'NO_FEE_SET'
    | 'PAID'
    | 'PAYMENT_REQUIRED';
  paymentStatus: string; // COMPLETE | PENDING | FAILED | CANCELLED | NOT_INITIATED
  amountDue?: number;
}

export async function checkPaymentGate(consultationId: string): Promise<PaymentGateResult> {
  if (!config.PAYMENT_ENFORCEMENT) {
    return { allowed: true, reason: 'ENFORCEMENT_OFF', paymentStatus: 'NOT_CHECKED' };
  }

  const consultation = await prisma.consultation.findUnique({
    where: { id: consultationId },
    select: {
      triageUrgency: true,
      doctor: { select: { consultationFee: true } },
      payment: { select: { status: true, amountTotal: true } },
    },
  });

  if (!consultation) {
    // Let the route's own 404 handling surface the missing consultation
    return { allowed: true, reason: 'ENFORCEMENT_OFF', paymentStatus: 'NOT_CHECKED' };
  }

  if (consultation.triageUrgency === 'EMERGENCY') {
    return { allowed: true, reason: 'EMERGENCY_EXEMPT', paymentStatus: consultation.payment?.status ?? 'NOT_INITIATED' };
  }

  const fee = consultation.doctor?.consultationFee;
  if (!fee || fee <= 0) {
    return { allowed: true, reason: 'NO_FEE_SET', paymentStatus: consultation.payment?.status ?? 'NOT_INITIATED' };
  }

  if (consultation.payment?.status === 'COMPLETE') {
    return { allowed: true, reason: 'PAID', paymentStatus: 'COMPLETE' };
  }

  return {
    allowed: false,
    reason: 'PAYMENT_REQUIRED',
    paymentStatus: consultation.payment?.status ?? 'NOT_INITIATED',
    amountDue: fee,
  };
}

/** Standard 402 payload so every gated route responds identically. */
export function paymentRequiredBody(gate: PaymentGateResult) {
  return {
    success: false as const,
    error:
      'Payment for this consultation is outstanding. Ask the patient to pay in the app, or record a cash/medical-aid payment.',
    code: 'PAYMENT_REQUIRED' as const,
    payment: {
      status: gate.paymentStatus,
      amountDue: gate.amountDue,
    },
  };
}
