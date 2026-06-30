import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/authenticate.js';
import { auditLog } from '../services/audit.service.js';
import { encryptField } from '../lib/encryption.js';
import {
  startDoctorProfileSession,
  startPatientProfileSession,
  continueProfileSession,
  extractDoctorProfile,
  extractPatientProfile,
  type ProfileRole,
} from '../services/profile-setup.js';
import type { ConversationMessage } from '../types/index.js';
import { SA_LANGUAGES } from '../types/index.js';

// ============================================================
// Schemas
// ============================================================

const StartProfileSchema = z.object({
  language: z.enum(SA_LANGUAGES as unknown as [string, ...string[]]).default('en'),
});

const ContinueProfileSchema = z.object({
  userMessage: z.string().min(1).max(2000),
});

// ============================================================
// In-memory session store
// ============================================================

interface ProfileSession {
  conversationHistory: ConversationMessage[];
  role: ProfileRole;
  language: string;
  isComplete: boolean;
  startedAt: string;
  userId: string;
}

const profileSessions = new Map<string, ProfileSession>();

// ============================================================
// Route plugin
// ============================================================

export async function profileSetupRoutes(fastify: FastifyInstance): Promise<void> {
  // ----------------------------------------------------------
  // POST /profile-setup/start
  // ----------------------------------------------------------
  fastify.post(
    '/profile-setup/start',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = StartProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { language } = parsed.data;
      const userId = request.user!.sub;
      const role = request.user!.role as ProfileRole;

      let sessionResponse: { message: string; isComplete: boolean };

      if (role === 'DOCTOR') {
        const doctor = await prisma.doctor.findUnique({
          where: { userId },
          select: { firstName: true, bio: true, specialization: true, consultationFee: true },
        });

        if (!doctor) {
          return reply.status(404).send({
            success: false,
            error: 'Doctor profile not found.',
            code: 'DOCTOR_NOT_FOUND',
          });
        }

        sessionResponse = await startDoctorProfileSession(doctor.firstName, language, {
          bio: doctor.bio ?? undefined,
          specialization: doctor.specialization ?? undefined,
          consultationFee: doctor.consultationFee ?? undefined,
        });
      } else {
        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { firstName: true },
        });

        if (!patient) {
          return reply.status(404).send({
            success: false,
            error: 'Patient profile not found.',
            code: 'PATIENT_NOT_FOUND',
          });
        }

        sessionResponse = await startPatientProfileSession(patient.firstName, language);
      }

      const ts = new Date().toISOString();

      profileSessions.set(userId, {
        conversationHistory: [
          { role: 'assistant', content: sessionResponse.message, timestamp: ts },
        ],
        role,
        language,
        isComplete: sessionResponse.isComplete,
        startedAt: ts,
        userId,
      });

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
          role,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /profile-setup/continue
  // ----------------------------------------------------------
  fastify.post(
    '/profile-setup/continue',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const parsed = ContinueProfileSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          success: false,
          error: 'Validation failed',
          details: parsed.error.flatten(),
        });
      }

      const { userMessage } = parsed.data;
      const userId = request.user!.sub;

      const session = profileSessions.get(userId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Profile setup session not found. Please start a new session.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      if (session.isComplete) {
        return reply.status(400).send({
          success: false,
          error: 'This profile setup session is already complete.',
          code: 'SESSION_COMPLETE',
        });
      }

      // Push user message to history
      session.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      const sessionResponse = await continueProfileSession(
        session.conversationHistory,
        userMessage,
        session.role,
        session.language
      );

      // Push AI response to history
      session.conversationHistory.push({
        role: 'assistant',
        content: sessionResponse.message,
        timestamp: new Date().toISOString(),
      });

      session.isComplete = sessionResponse.isComplete;

      return reply.send({
        success: true,
        data: {
          message: sessionResponse.message,
          isComplete: sessionResponse.isComplete,
        },
      });
    }
  );

  // ----------------------------------------------------------
  // POST /profile-setup/complete
  // Extract profile data and persist to database
  // ----------------------------------------------------------
  fastify.post(
    '/profile-setup/complete',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const userId = request.user!.sub;

      const session = profileSessions.get(userId);
      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Profile setup session not found.',
          code: 'SESSION_NOT_FOUND',
        });
      }

      if (session.role === 'DOCTOR') {
        const profileData = await extractDoctorProfile(session.conversationHistory);

        const updateData: Record<string, unknown> = {};
        if (profileData.bio !== undefined) updateData.bio = profileData.bio;
        if (profileData.qualifications !== undefined) updateData.qualifications = profileData.qualifications;
        if (profileData.specialization !== undefined) updateData.specialization = profileData.specialization;
        if (profileData.consultationFee !== undefined) updateData.consultationFee = profileData.consultationFee;
        if (profileData.languages !== undefined) updateData.languages = profileData.languages;
        if (profileData.practiceNumber !== undefined) updateData.practiceNumber = profileData.practiceNumber;

        if (Object.keys(updateData).length > 0) {
          await prisma.doctor.update({
            where: { userId },
            data: updateData as never,
          });
        }
      } else {
        const profileData = await extractPatientProfile(session.conversationHistory);

        // Update patient record
        const patientUpdateData: Record<string, unknown> = {};
        if (profileData.emergencyContact !== undefined) {
          patientUpdateData.emergencyContact = encryptField(
            JSON.stringify(profileData.emergencyContact)
          );
        }

        if (Object.keys(patientUpdateData).length > 0) {
          await prisma.patient.update({
            where: { userId },
            data: patientUpdateData as never,
          });
        }

        // Upsert EmergencyProfile if we have health data
        const hasHealthData =
          profileData.allergies !== undefined ||
          profileData.chronicConditions !== undefined ||
          profileData.currentMedications !== undefined;

        if (hasHealthData) {
          const patient = await prisma.patient.findUnique({
            where: { userId },
            select: { id: true },
          });

          if (patient) {
            const emergencyUpdateData: Record<string, unknown> = {};
            if (profileData.allergies !== undefined) {
              emergencyUpdateData.encryptedAllergies = JSON.stringify(profileData.allergies);
            }
            if (profileData.chronicConditions !== undefined) {
              emergencyUpdateData.encryptedConditions = JSON.stringify(profileData.chronicConditions);
            }
            if (profileData.currentMedications !== undefined) {
              emergencyUpdateData.encryptedMedications = JSON.stringify(profileData.currentMedications);
            }

            await prisma.emergencyProfile.upsert({
              where: { patientId: patient.id },
              update: emergencyUpdateData as never,
              create: {
                patientId: patient.id,
                isEnabled: true,
                ...(emergencyUpdateData as object),
              } as never,
            });
          }
        }
      }

      // Clean up session
      profileSessions.delete(userId);

      await auditLog({
        userId,
        action: 'PROFILE_SETUP_COMPLETE',
        resource: 'User',
        resourceId: userId,
        metadata: { role: session.role },
      });

      return reply.send({
        success: true,
        data: { message: 'Profile updated successfully' },
      });
    }
  );
}
