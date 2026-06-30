import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { config } from '../config.js';
import {
  generatePayFastUrl,
  verifyPayFastITN,
  calculateSplit,
} from '../services/payfast.service.js';

// ============================================================
// Schemas
// ============================================================

const InitiatePaymentSchema = z.object({
  consultationId: z.string().min(1),
});

// ============================================================
// Route plugin
// ============================================================

export async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /payments/initiate
  // Authenticated: PATIENT only
  // ----------------------------------------------------------
  fastify.post(
    '/payments/initiate',
    { preHandler: [authenticate, requireRole('PATIENT')] },
    async (request, reply) => {
      const parsed = InitiatePaymentSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Invalid request body',
          details: parsed.error.format(),
        });
      }

      const { consultationId } = parsed.data;
      const userId = request.user.sub;

      // Resolve patient record
      const patient = await prisma.patient.findUnique({
        where: { userId },
        include: { user: { select: { email: true } } },
      });

      if (!patient) {
        return reply.status(404).send({ success: false, error: 'Patient profile not found' });
      }

      // Verify the consultation belongs to this patient
      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
        include: {
          doctor: { select: { id: true, firstName: true, lastName: true, consultationFee: true } },
        },
      });

      if (!consultation || consultation.patientId !== patient.id) {
        return reply.status(404).send({ success: false, error: 'Consultation not found' });
      }

      if (!consultation.doctor) {
        return reply.status(400).send({ success: false, error: 'No doctor assigned to this consultation' });
      }

      const fee = consultation.doctor.consultationFee;
      if (!fee || fee <= 0) {
        return reply.status(400).send({ success: false, error: 'Doctor has not set a consultation fee' });
      }

      // Check for an existing payment record
      const existingPayment = await prisma.payment.findUnique({
        where: { consultationId },
      });

      if (existingPayment && existingPayment.status === 'COMPLETE') {
        return reply.status(400).send({ success: false, error: 'This consultation has already been paid' });
      }

      const { doctor, platform } = calculateSplit(fee);

      // Upsert: create or reuse an existing PENDING record
      const payment =
        existingPayment ??
        (await prisma.payment.create({
          data: {
            consultationId,
            patientId: patient.id,
            doctorId: consultation.doctor.id,
            amountTotal: fee,
            amountDoctor: doctor,
            amountPlatform: platform,
            paymentMethod: 'payfast',
            status: 'PENDING',
          },
        }));

      const patientEmail = patient.user.email;
      const formattedAmount = fee.toFixed(2);

      const paymentUrl = generatePayFastUrl({
        merchant_id: config.PAYFAST_MERCHANT_ID,
        merchant_key: config.PAYFAST_MERCHANT_KEY,
        return_url: `${config.APP_URL}/payment/success`,
        cancel_url: `${config.APP_URL}/payment/cancel`,
        notify_url: `${config.API_URL}/payments/itn`,
        name_first: patient.firstName,
        name_last: patient.lastName,
        email_address: patientEmail ?? '',
        m_payment_id: payment.id,
        amount: formattedAmount,
        item_name: 'MedAI Consultation',
        item_description: `Consultation with Dr. ${consultation.doctor.lastName}`,
        custom_str1: consultationId,
      });

      return reply.send({
        success: true,
        data: {
          paymentId: payment.id,
          paymentUrl,
          amount: fee,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // GET /payments/status/:consultationId
  // Authenticated: any role
  // ----------------------------------------------------------
  fastify.get(
    '/payments/status/:consultationId',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };

      const payment = await prisma.payment.findUnique({
        where: { consultationId },
        select: {
          id: true,
          status: true,
          amountTotal: true,
          paidAt: true,
        },
      });

      if (!payment) {
        return reply.send({
          success: true,
          data: { status: 'NOT_INITIATED' },
        });
      }

      return reply.send({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amountTotal,
          paidAt: payment.paidAt,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /payments/itn
  // NO authentication — PayFast webhook (ITN)
  // PayFast sends application/x-www-form-urlencoded
  // We MUST respond 200 quickly; do heavy lifting after reply
  // ----------------------------------------------------------
  fastify.post('/payments/itn', async (request, reply) => {
    // Respond immediately so PayFast doesn't timeout
    reply.status(200).send('OK');

    // Run verification + DB update asynchronously
    setImmediate(async () => {
      try {
        const body = request.body as Record<string, string>;
        // rawBody reconstruction for PayFast validator
        const rawBody = Object.entries(body)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');

        const isValid = await verifyPayFastITN(body, rawBody);
        if (!isValid) {
          fastify.log.warn({ body }, 'PayFast ITN: invalid signature — ignoring');
          return;
        }

        const paymentId = body['m_payment_id'];
        const payfastPaymentId = body['pf_payment_id'];
        const paymentStatus = body['payment_status'];

        if (!paymentId) {
          fastify.log.warn({ body }, 'PayFast ITN: missing m_payment_id');
          return;
        }

        if (paymentStatus === 'COMPLETE') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETE',
              payfastPaymentId: payfastPaymentId ?? null,
              paidAt: new Date(),
            },
          });
          fastify.log.info({ paymentId, payfastPaymentId }, 'PayFast ITN: payment marked COMPLETE');
        } else if (paymentStatus === 'CANCELLED') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'CANCELLED' },
          });
          fastify.log.info({ paymentId }, 'PayFast ITN: payment marked CANCELLED');
        } else if (paymentStatus === 'FAILED') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: { status: 'FAILED' },
          });
          fastify.log.info({ paymentId }, 'PayFast ITN: payment marked FAILED');
        } else {
          fastify.log.info({ paymentId, paymentStatus }, 'PayFast ITN: unhandled payment_status');
        }
      } catch (err) {
        fastify.log.error(err, 'PayFast ITN: error processing notification');
      }
    });
  });

  // ----------------------------------------------------------
  // POST /payments/cash/:consultationId
  // Authenticated: DOCTOR only
  // Doctor marks consultation as paid by cash/medical aid
  // ----------------------------------------------------------
  fastify.post(
    '/payments/cash/:consultationId',
    { preHandler: [authenticate, requireRole('DOCTOR')] },
    async (request, reply) => {
      const { consultationId } = request.params as { consultationId: string };
      const userId = request.user.sub;

      const doctor = await prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) {
        return reply.status(404).send({ success: false, error: 'Doctor profile not found' });
      }

      const consultation = await prisma.consultation.findUnique({
        where: { id: consultationId },
      });

      if (!consultation || consultation.doctorId !== doctor.id) {
        return reply.status(404).send({ success: false, error: 'Consultation not found' });
      }

      // Find existing or derive fee
      const existingPayment = await prisma.payment.findUnique({
        where: { consultationId },
      });

      const fee = existingPayment?.amountTotal ?? 0;
      const { doctor: amountDoctor, platform: amountPlatform } = calculateSplit(fee);

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'COMPLETE',
            paymentMethod: 'cash',
            paidAt: new Date(),
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            consultationId,
            patientId: consultation.patientId,
            doctorId: doctor.id,
            amountTotal: fee,
            amountDoctor,
            amountPlatform,
            paymentMethod: 'cash',
            status: 'COMPLETE',
            paidAt: new Date(),
          },
        });
      }

      return reply.send({ success: true });
    }
  );
}
