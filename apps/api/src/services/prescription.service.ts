import prisma from '../lib/prisma.js';
import { encryptJSON, decryptJSON } from '../lib/encryption.js';

// ============================================================
// Interfaces
// ============================================================

export interface PrescriptionItem {
  medication: string;
  dose: string;
  route: string;           // "Oral", "IV", "IM", "Topical"
  frequency: string;       // "Twice daily (12-hourly)", "Three times daily (8-hourly)"
  duration: string;        // "5 days", "1 month", "Lifelong"
  quantity: number;        // total units to dispense
  instructions: string;    // patient instructions
  isScheduled: boolean;    // Scheduled substance (DDA requirement)
  scheduleNumber?: number; // 1-7 for scheduled substances
  repetitions?: number;    // for repeat scripts
}

export interface PrescriptionData {
  consultationId: string;
  doctorId: string;
  patientId: string;
  items: PrescriptionItem[];
  isRepeat: boolean;
  repeatTotal?: number;
  notes?: string;
}

export interface DecryptedPrescription {
  id: string;
  scriptNumber: string;
  issueDate: Date;
  validUntilDate?: Date | null;
  items: PrescriptionItem[];
  containsDDA: boolean;
  isRepeat: boolean;
  repeatTotal: number;
  repeatRemaining: number;
  status: string;
  doctorName: string;
  doctorHPCSA: string;
  doctorPracticeNumber?: string | null;
}

// ============================================================
// Script number generator: MedAI-YYYY-NNNNNN
// ============================================================

export async function generateScriptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `MedAI-${year}-`;

  // Count prescriptions issued this year to get next sequential number
  const count = await prisma.prescription.count({
    where: {
      scriptNumber: {
        startsWith: prefix,
      },
    },
  });

  const sequential = String(count + 1).padStart(6, '0');
  return `${prefix}${sequential}`;
}

// ============================================================
// Create prescription
// ============================================================

export async function createPrescription(data: PrescriptionData): Promise<{
  id: string;
  scriptNumber: string;
  containsDDA: boolean;
}> {
  const { consultationId, doctorId, patientId, items, isRepeat, repeatTotal, notes } = data;

  // Determine whether any item is a Dangerous Drugs Act scheduled substance
  const containsDDA = items.some((item) => item.isScheduled);

  const scriptNumber = await generateScriptNumber();

  // Repeat prescriptions are valid for 6 months; normal scripts 30 days
  const now = new Date();
  const validUntilDate = new Date(now);
  if (isRepeat) {
    validUntilDate.setMonth(validUntilDate.getMonth() + 6);
  } else {
    validUntilDate.setDate(validUntilDate.getDate() + 30);
  }

  const repeatCount = isRepeat ? (repeatTotal ?? 1) : 0;

  // Encrypt prescription items with master key
  const encryptedItems = encryptJSON(items);

  const prescription = await prisma.prescription.create({
    data: {
      consultationId,
      doctorId,
      patientId,
      scriptNumber,
      validUntilDate,
      encryptedItems,
      containsDDA,
      isRepeat,
      repeatTotal: repeatCount,
      repeatRemaining: repeatCount,
      status: 'ISSUED',
    },
  });

  return {
    id: prescription.id,
    scriptNumber: prescription.scriptNumber,
    containsDDA: prescription.containsDDA,
  };
}

// ============================================================
// Get prescriptions for a consultation
// ============================================================

export async function getConsultationPrescriptions(
  consultationId: string
): Promise<DecryptedPrescription[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: { consultationId },
    orderBy: { issueDate: 'desc' },
    include: {
      consultation: {
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              hpcsaNumber: true,
              practiceNumber: true,
            },
          },
        },
      },
    },
  });

  return prescriptions.map((p) => {
    const items = decryptJSON(p.encryptedItems) as PrescriptionItem[];
    const doctor = p.consultation.doctor;

    return {
      id: p.id,
      scriptNumber: p.scriptNumber,
      issueDate: p.issueDate,
      validUntilDate: p.validUntilDate,
      items,
      containsDDA: p.containsDDA,
      isRepeat: p.isRepeat,
      repeatTotal: p.repeatTotal,
      repeatRemaining: p.repeatRemaining,
      status: p.status,
      doctorName: doctor ? `Dr ${doctor.firstName} ${doctor.lastName}` : 'Unknown',
      doctorHPCSA: doctor?.hpcsaNumber ?? '',
      doctorPracticeNumber: doctor?.practiceNumber ?? null,
    };
  });
}

// ============================================================
// Get patient prescription history
// ============================================================

export async function getPatientPrescriptions(
  patientId: string,
  limit = 50
): Promise<DecryptedPrescription[]> {
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId },
    orderBy: { issueDate: 'desc' },
    take: limit,
    include: {
      consultation: {
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              hpcsaNumber: true,
              practiceNumber: true,
            },
          },
        },
      },
    },
  });

  return prescriptions.map((p) => {
    const items = decryptJSON(p.encryptedItems) as PrescriptionItem[];
    const doctor = p.consultation.doctor;

    return {
      id: p.id,
      scriptNumber: p.scriptNumber,
      issueDate: p.issueDate,
      validUntilDate: p.validUntilDate,
      items,
      containsDDA: p.containsDDA,
      isRepeat: p.isRepeat,
      repeatTotal: p.repeatTotal,
      repeatRemaining: p.repeatRemaining,
      status: p.status,
      doctorName: doctor ? `Dr ${doctor.firstName} ${doctor.lastName}` : 'Unknown',
      doctorHPCSA: doctor?.hpcsaNumber ?? '',
      doctorPracticeNumber: doctor?.practiceNumber ?? null,
    };
  });
}

// ============================================================
// Generate prescription HTML (SA prescription pad format)
// ============================================================

export async function generatePrescriptionHTML(prescriptionId: string): Promise<string> {
  const prescription = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: {
      consultation: {
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              hpcsaNumber: true,
              practiceNumber: true,
              specialization: true,
              doctorType: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              idNumber: true,
            },
          },
        },
      },
    },
  });

  if (!prescription) {
    throw new Error('Prescription not found');
  }

  const items = decryptJSON(prescription.encryptedItems) as PrescriptionItem[];
  const { doctor, patient } = prescription.consultation;

  const issueDate = prescription.issueDate.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const validUntil = prescription.validUntilDate
    ? prescription.validUntilDate.toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const patientDOB = patient
    ? new Date(patient.dateOfBirth).toLocaleDateString('en-ZA', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Decrypt patient ID if available
  let patientIdDisplay = '';
  if (patient?.idNumber) {
    try {
      const { decryptField } = await import('../lib/encryption.js');
      patientIdDisplay = decryptField(patient.idNumber);
    } catch {
      patientIdDisplay = '';
    }
  }

  const doctorTitle =
    doctor?.doctorType === 'SPECIALIST' && doctor.specialization
      ? `Specialist: ${doctor.specialization}`
      : 'General Practitioner';

  const ddaWarning = prescription.containsDDA
    ? `<div class="dda-warning">
        ⚠️ <strong>PLEASE DISPENSE AS WRITTEN</strong> — This prescription contains Scheduled Substance(s) regulated under the Drugs and Drug Trafficking Act (Act 140 of 1992). This is a <strong>DANGEROUS DRUGS ACT (DDA) prescription</strong>. Pharmacist must record dispensing in the DDA register. <strong>DO NOT SUBSTITUTE.</strong>
      </div>`
    : '';

  const repeatSection =
    prescription.isRepeat
      ? `<div class="repeat-info">
          <p><strong>REPEAT PRESCRIPTION</strong></p>
          <p>Total repeats: <strong>${prescription.repeatTotal}</strong> &nbsp;|&nbsp; Remaining: <strong>${prescription.repeatRemaining}</strong></p>
          <p>Valid until: <strong>${validUntil}</strong></p>
        </div>`
      : `<p class="valid-until">Valid until: <strong>${validUntil}</strong></p>`;

  const itemsHTML = items
    .map((item, index) => {
      const scheduleTag =
        item.isScheduled && item.scheduleNumber
          ? `<span class="schedule-badge">Schedule ${item.scheduleNumber}</span>`
          : '';

      return `
        <div class="rx-item">
          <div class="rx-number">${index + 1}.</div>
          <div class="rx-details">
            <div class="rx-drug-line">
              <strong>${item.medication}</strong> ${scheduleTag}
            </div>
            <div class="rx-sig">
              ${item.dose} — ${item.route} — ${item.frequency}
            </div>
            <div class="rx-duration">
              Duration: <strong>${item.duration}</strong> &nbsp;|&nbsp; Quantity: <strong>${item.quantity} unit(s)</strong>
            </div>
            <div class="rx-instructions">
              <em>Instructions to patient: ${item.instructions}</em>
            </div>
          </div>
        </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Prescription ${prescription.scriptNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 13px;
      color: #1a1a1a;
      background: #ffffff;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0f4c81;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .logo {
      font-size: 28px;
      font-weight: 900;
      color: #0f4c81;
      letter-spacing: -1px;
    }
    .logo span { color: #e63946; }
    .doctor-block { text-align: right; font-size: 12px; line-height: 1.6; }
    .doctor-block .doctor-name { font-size: 15px; font-weight: 700; color: #0f4c81; }
    .script-meta {
      display: flex;
      justify-content: space-between;
      background: #f0f4f8;
      border: 1px solid #c9d8e8;
      border-radius: 6px;
      padding: 10px 16px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .script-meta div { line-height: 1.8; }
    .patient-section {
      border: 1px solid #dce3ea;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }
    .patient-section h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #555;
      margin-bottom: 8px;
    }
    .patient-section .patient-name { font-size: 15px; font-weight: 700; }
    .patient-section .patient-meta { font-size: 12px; color: #444; margin-top: 4px; }
    .rx-header {
      font-size: 22px;
      font-weight: 900;
      color: #0f4c81;
      margin-bottom: 12px;
      font-style: italic;
    }
    .dda-warning {
      background: #fff3cd;
      border: 2px solid #e6a817;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12px;
      line-height: 1.6;
    }
    .rx-item {
      display: flex;
      gap: 12px;
      border: 1px solid #dce3ea;
      border-radius: 6px;
      padding: 12px 14px;
      margin-bottom: 10px;
      background: #fafbfc;
    }
    .rx-number { font-size: 18px; font-weight: 700; color: #0f4c81; min-width: 24px; }
    .rx-details { flex: 1; }
    .rx-drug-line { font-size: 15px; margin-bottom: 4px; }
    .rx-sig { color: #333; margin-bottom: 4px; }
    .rx-duration { font-size: 12px; color: #444; margin-bottom: 4px; }
    .rx-instructions { font-size: 12px; color: #666; }
    .schedule-badge {
      display: inline-block;
      background: #e63946;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      vertical-align: middle;
      margin-left: 6px;
    }
    .repeat-info {
      background: #e8f4fd;
      border: 1px solid #b0d4ed;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 16px;
      font-size: 12px;
      line-height: 1.8;
    }
    .valid-until { margin-top: 12px; font-size: 12px; color: #555; }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #dce3ea;
    }
    .sig-block { width: 45%; }
    .sig-line {
      border-bottom: 1px solid #333;
      height: 40px;
      margin-bottom: 6px;
    }
    .sig-label { font-size: 11px; color: #555; }
    .footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #eee;
      font-size: 10px;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- Header: logo + doctor info -->
  <div class="header">
    <div class="logo">Med<span>AI</span></div>
    <div class="doctor-block">
      <div class="doctor-name">Dr ${doctor?.firstName ?? ''} ${doctor?.lastName ?? ''}</div>
      <div>${doctorTitle}</div>
      <div>HPCSA No: <strong>${doctor?.hpcsaNumber ?? 'N/A'}</strong></div>
      ${doctor?.practiceNumber ? `<div>Practice No: <strong>${doctor.practiceNumber}</strong></div>` : ''}
      <div>MedAI Digital Health Platform</div>
      <div>Tel: +27 (0) 800 MED-AI1</div>
    </div>
  </div>

  <!-- Script meta -->
  <div class="script-meta">
    <div>
      <div>Script No: <strong>${prescription.scriptNumber}</strong></div>
      <div>Issue Date: <strong>${issueDate}</strong></div>
    </div>
    <div>
      <div>Status: <strong>${prescription.status}</strong></div>
      <div>DDA Script: <strong>${prescription.containsDDA ? 'YES' : 'NO'}</strong></div>
    </div>
  </div>

  <!-- Patient details -->
  <div class="patient-section">
    <h3>Patient</h3>
    <div class="patient-name">${patient?.firstName ?? ''} ${patient?.lastName ?? ''}</div>
    <div class="patient-meta">
      Date of Birth: <strong>${patientDOB}</strong>
      ${patientIdDisplay ? `&nbsp;|&nbsp; SA ID: <strong>${patientIdDisplay}</strong>` : ''}
    </div>
  </div>

  <!-- DDA warning (only for scheduled substances) -->
  ${ddaWarning}

  <!-- Rx symbol and items -->
  <div class="rx-header">&#8478;</div>
  ${itemsHTML}

  <!-- Repeat / validity info -->
  ${repeatSection}

  <!-- Signature area -->
  <div class="signature-section">
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Doctor Signature &amp; Date</div>
    </div>
    <div class="sig-block">
      <div class="sig-line"></div>
      <div class="sig-label">Pharmacist Signature &amp; Stamp</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Generated by MedAI Digital Health Platform &mdash; This is a legally valid electronic prescription issued under the Electronic Communications and Transactions Act (ECT Act, Act 25 of 2002). For queries contact support@medai.co.za
  </div>

</body>
</html>`;
}
