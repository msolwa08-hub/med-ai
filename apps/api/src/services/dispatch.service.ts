/**
 * Consultation Dispatch Service — the "ping nearby drivers" half of the
 * patient–doctor marketplace.
 *
 * When a patient completes an AI history on an UNASSIGNED consultation
 * (they didn't pick a doctor), the consultation used to sit silently in a
 * global queue until a doctor happened to open the app. This service closes
 * that loop:
 *
 *   1. Stamps the consultation with the history's triage urgency (so the
 *      queue can order EMERGENCY above ROUTINE).
 *   2. Finds available, HPCSA-verified doctors whose service radius covers
 *      the patient's booking location.
 *   3. Ranks them (incentive/quality score + proximity + language match)
 *      and push-notifies the top candidates — first to accept wins, exactly
 *      like ride-hailing dispatch.
 *
 * Called fire-and-forget from every history-completion point (general,
 * specialty, O&G, antenatal follow-up); failures are logged, never thrown —
 * dispatch must not break history completion.
 */

import prisma from '../lib/prisma.js';
import type { TriageUrgency } from '@prisma/client';
import { findNearbyDoctors } from './geolocation.service.js';
import { rankDoctorsForPatient } from './incentive.service.js';
import { sendPushToUser } from './notification.service.js';

const MAX_DOCTORS_NOTIFIED = 10;
const DISPATCH_RADIUS_KM = 50; // outer bound; each doctor's own radius still applies

const URGENCY_LABEL: Record<TriageUrgency, string> = {
  ROUTINE: 'Routine',
  SOON: 'Priority',
  URGENT: 'URGENT',
  EMERGENCY: 'EMERGENCY',
};

/**
 * Stamp triage urgency and, for unassigned consultations, notify nearby
 * eligible doctors. Safe to call multiple times (re-dispatch on re-complete).
 */
type DispatchLogger = { info: (o: unknown, msg: string) => void; warn: (o: unknown, msg: string) => void };
const consoleLog: DispatchLogger = {
  info: (o, msg) => console.info(`[Dispatch] ${msg}`, o),
  warn: (o, msg) => console.warn(`[Dispatch] ${msg}`, o),
};

export async function dispatchConsultation(
  consultationId: string,
  urgency: TriageUrgency | undefined,
  log: DispatchLogger = consoleLog
): Promise<void> {
  try {
    const consultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: urgency ? { triageUrgency: urgency } : {},
      select: {
        id: true,
        doctorId: true,
        patientLat: true,
        patientLng: true,
        triageUrgency: true,
        patient: { select: { preferredLanguage: true } },
      },
    });

    // Assigned consultations already notify their doctor via status flows.
    if (consultation.doctorId) return;

    if (consultation.patientLat == null || consultation.patientLng == null) {
      log.info({ consultationId }, 'Dispatch skipped — no booking location on consultation');
      return;
    }

    const nearby = await findNearbyDoctors(
      { lat: consultation.patientLat, lng: consultation.patientLng },
      DISPATCH_RADIUS_KM
    );
    if (nearby.length === 0) {
      log.info({ consultationId }, 'Dispatch found no eligible doctors in range');
      return;
    }

    const effectiveUrgency = consultation.triageUrgency ?? 'ROUTINE';
    const ranked = await rankDoctorsForPatient(
      nearby,
      consultation.patient?.preferredLanguage ?? undefined,
      effectiveUrgency === 'EMERGENCY' || effectiveUrgency === 'URGENT' ? 'URGENT' : 'ROUTINE'
    );

    const targets = ranked.slice(0, MAX_DOCTORS_NOTIFIED);
    const label = URGENCY_LABEL[effectiveUrgency];

    // Resolve doctor userIds for push delivery in one query
    const doctorRows = await prisma.doctor.findMany({
      where: { id: { in: targets.map((d) => d.id) } },
      select: { id: true, userId: true },
    });
    const userIdByDoctorId = new Map(doctorRows.map((d) => [d.id, d.userId]));

    await Promise.allSettled(
      targets.map((d) => {
        const userId = userIdByDoctorId.get(d.id);
        if (!userId) return Promise.resolve();
        return sendPushToUser(
          userId,
          effectiveUrgency === 'EMERGENCY' || effectiveUrgency === 'URGENT'
            ? `${label} — patient waiting near you`
            : 'New patient near you',
          `A patient ${d.distanceKm}km away has completed their history (${label.toLowerCase()}). First to accept takes the consultation.`,
          { consultationId, screen: 'Queue', urgency: effectiveUrgency }
        );
      })
    );

    log.info(
      { consultationId, notified: targets.length, urgency: effectiveUrgency },
      'Dispatch notified nearby doctors'
    );
  } catch (err) {
    log.warn({ err, consultationId }, 'Dispatch failed (non-fatal)');
  }
}
