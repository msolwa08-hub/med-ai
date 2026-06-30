// Expo Push Notification service
// Calls Expo's push API: https://exp.host/api/v2/push/send

import prisma from '../lib/prisma.js';

interface PushPayload {
  to: string;          // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const payload: PushPayload = {
    to: expoPushToken,
    title,
    body,
    data: data ?? {},
    sound: 'default',
  };

  const response = await fetch('https://exp.host/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '(no body)');
    console.error(
      `[PUSH] Expo push failed: status=${response.status} body=${text}`
    );
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { pushToken: true },
  });

  if (!user?.pushToken) {
    console.log(`[PUSH] No push token for userId=${userId}, skipping notification`);
    return;
  }

  await sendPushNotification(user.pushToken, title, body, data);
}

export const Notifications = {
  doctorAccepted: (
    patientUserId: string,
    doctorName: string,
    consultationId: string
  ) =>
    sendPushToUser(
      patientUserId,
      'Doctor Accepted',
      `Dr. ${doctorName} has accepted your consultation`,
      { consultationId, screen: 'ConsultationStatus' }
    ),

  consultationStatusChanged: (
    patientUserId: string,
    status: string,
    consultationId: string
  ) =>
    sendPushToUser(
      patientUserId,
      'Consultation Update',
      `Your consultation status: ${status}`,
      { consultationId, screen: 'ConsultationStatus' }
    ),

  newPatientInQueue: (
    doctorUserId: string,
    patientName: string,
    consultationId: string
  ) =>
    sendPushToUser(
      doctorUserId,
      'New Patient',
      `${patientName} is requesting a consultation`,
      { consultationId, screen: 'Queue' }
    ),

  labResultsAvailable: (patientUserId: string) =>
    sendPushToUser(
      patientUserId,
      'Lab Results',
      'Your lab results are now available',
      { screen: 'LabResults' }
    ),
};
