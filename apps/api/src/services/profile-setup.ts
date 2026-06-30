/**
 * AI-Driven Profile Setup Service
 *
 * Handles conversational profile completion for doctors and patients.
 * Claude asks one question at a time to collect profile information,
 * then extracts structured data from the completed conversation.
 */

import { anthropic, CLAUDE_MODEL } from '../lib/claude.js';
import type { ConversationMessage } from '../types/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfileRole = 'DOCTOR' | 'PATIENT';

export interface ProfileSessionResponse {
  message: string;
  isComplete: boolean;
}

export interface DoctorProfileData {
  bio?: string;
  qualifications?: Array<{ degree: string; institution: string; year: number }>;
  specialization?: string;
  consultationFee?: number;
  languages?: string[];
  practiceNumber?: string;
  medicalAidAffiliations?: string[];
}

export interface PatientProfileData {
  emergencyContact?: { name: string; relationship: string; phone: string };
  chronicConditions?: string[];
  currentMedications?: Array<{ name: string; dose: string; indication?: string }>;
  allergies?: string[];
  medicalAid?: { provider: string; memberNumber: string };
  email?: string;
}

// ─── System Prompts ───────────────────────────────────────────────────────────

function buildDoctorSystemPrompt(
  firstName: string,
  language: string,
  existingData: { bio?: string; specialization?: string; consultationFee?: number }
): string {
  const feeHint = existingData.consultationFee !== undefined
    ? ` (currently set to R${existingData.consultationFee})`
    : '';

  return `You are a warm, professional AI assistant helping Dr ${firstName} complete their public profile on MedAI — a South African telehealth platform.

Communicate in ${language === 'en' ? 'English' : language}. Be warm, professional, and concise.

Your goal is to collect the following information by asking ONE question at a time. Do not ask multiple questions at once. Wait for the doctor's answer before proceeding to the next topic.

Topics to cover IN ORDER:
1. Bio / introduction — their practice style, philosophy, and approach to patients (up to 3 sentences, written in first person for the patient-facing profile)
2. Qualifications — MBChB, fellowship, postgraduate degrees (include institution and year for each)
3. Special clinical interests or areas of focus
4. Practice name and address (for patient-facing display)
5. Medical aid affiliations — which medical aid schemes they are registered with
6. Consultation fee${feeHint} — confirm or update their standard consultation fee in ZAR

After you have asked about AND received an answer for ALL six topics above, provide a warm closing summary and end your message with exactly: [PROFILE_COMPLETE]

Do NOT include [PROFILE_COMPLETE] until all six topics have been covered and answered by the doctor.

${existingData.bio ? `Note: The doctor already has a bio: "${existingData.bio}" — you can offer to update it.` : ''}
${existingData.specialization ? `Note: Their current specialization is listed as "${existingData.specialization}".` : ''}`;
}

function buildPatientSystemPrompt(firstName: string, language: string): string {
  return `You are a friendly, warm AI assistant helping ${firstName} set up their health profile on MedAI — a South African healthcare app.

Communicate in ${language === 'en' ? 'English' : language}. Use plain, everyday language — no medical jargon. Be encouraging and reassuring.

This will take about 2 minutes. You will collect important health information to keep on ${firstName}'s profile for their doctors.

Ask ONE question at a time. Wait for the answer before moving on.

Topics to cover IN ORDER:
1. Chronic conditions — do they have any long-term conditions like diabetes, hypertension, asthma, etc.? (or "none")
2. Current regular medications — name and dose of any medications they take regularly (or "none")
3. Known allergies — to medications, foods, or environmental triggers (or "none")
4. Emergency contact — name, relationship to the patient, and phone number
5. Medical aid — provider name and member number (or "none / I pay privately")

After you have asked about AND received an answer for ALL five topics above, give ${firstName} a warm confirmation that their profile is all set, and end your message with exactly: [PROFILE_COMPLETE]

Do NOT include [PROFILE_COMPLETE] until all five topics have been covered and answered.`;
}

// ─── Session Functions ────────────────────────────────────────────────────────

export async function startDoctorProfileSession(
  firstName: string,
  language: string,
  existingData: { bio?: string; specialization?: string; consultationFee?: number }
): Promise<ProfileSessionResponse> {
  const systemPrompt = buildDoctorSystemPrompt(firstName, language, existingData);

  const openingInstruction = `Greet Dr ${firstName} warmly and professionally. Briefly explain that you'll be helping them complete their public profile visible to patients on MedAI. Start by asking about their bio or professional introduction.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: openingInstruction }],
  });

  const message = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const isComplete = message.includes('[PROFILE_COMPLETE]');

  return {
    message: message.replace('[PROFILE_COMPLETE]', '').trim(),
    isComplete,
  };
}

export async function startPatientProfileSession(
  firstName: string,
  language: string
): Promise<ProfileSessionResponse> {
  const systemPrompt = buildPatientSystemPrompt(firstName, language);

  const openingInstruction = `Greet ${firstName} warmly. Explain that you're going to help them set up their health profile and it will only take about 2 minutes. Start by asking about any chronic conditions they may have.`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages: [{ role: 'user', content: openingInstruction }],
  });

  const message = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const isComplete = message.includes('[PROFILE_COMPLETE]');

  return {
    message: message.replace('[PROFILE_COMPLETE]', '').trim(),
    isComplete,
  };
}

export async function continueProfileSession(
  conversationHistory: ConversationMessage[],
  userMessage: string,
  role: ProfileRole,
  language: string
): Promise<ProfileSessionResponse> {
  // Build system prompt based on role (use a minimal continuation prompt)
  const systemPrompt =
    role === 'DOCTOR'
      ? `You are a warm, professional AI assistant completing a doctor's public profile on MedAI. Communicate in ${language === 'en' ? 'English' : language}. Ask ONE question at a time. After all topics (bio, qualifications, clinical interests, practice address, medical aid affiliations, consultation fee) are covered, end with [PROFILE_COMPLETE].`
      : `You are a friendly AI assistant completing a patient's health profile on MedAI. Communicate in ${language === 'en' ? 'English' : language}. Use plain language. Ask ONE question at a time. After all topics (chronic conditions, medications, allergies, emergency contact, medical aid) are covered, end with [PROFILE_COMPLETE].`;

  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 600,
    system: systemPrompt,
    messages,
  });

  const message = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const isComplete = message.includes('[PROFILE_COMPLETE]');

  return {
    message: message.replace('[PROFILE_COMPLETE]', '').trim(),
    isComplete,
  };
}

// ─── Profile Extraction ───────────────────────────────────────────────────────

export async function extractDoctorProfile(
  conversationHistory: ConversationMessage[]
): Promise<DoctorProfileData> {
  const conversationText = conversationHistory
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Doctor'}: ${m.content}`)
    .join('\n');

  const extractionPrompt = `Extract structured profile data from this doctor profile setup conversation.

CONVERSATION:
${conversationText}

Return ONLY valid JSON matching this schema (omit fields not mentioned):
{
  "bio": "string — doctor's professional bio in first person",
  "qualifications": [{"degree": "string", "institution": "string", "year": 2020}],
  "specialization": "string — primary specialty or clinical focus",
  "consultationFee": 500,
  "languages": ["string"],
  "practiceNumber": "string — practice name or address",
  "medicalAidAffiliations": ["string — medical aid scheme names"]
}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: extractionPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');

  if (start === -1 || end === -1) {
    return {};
  }

  try {
    return JSON.parse(jsonStr.slice(start, end + 1)) as DoctorProfileData;
  } catch {
    return {};
  }
}

export async function extractPatientProfile(
  conversationHistory: ConversationMessage[]
): Promise<PatientProfileData> {
  const conversationText = conversationHistory
    .map((m) => `${m.role === 'assistant' ? 'AI' : 'Patient'}: ${m.content}`)
    .join('\n');

  const extractionPrompt = `Extract structured health profile data from this patient profile setup conversation.

CONVERSATION:
${conversationText}

Return ONLY valid JSON matching this schema (omit fields not mentioned or where the patient said "none"):
{
  "emergencyContact": {"name": "string", "relationship": "string", "phone": "string"},
  "chronicConditions": ["string"],
  "currentMedications": [{"name": "string", "dose": "string", "indication": "string"}],
  "allergies": ["string"],
  "medicalAid": {"provider": "string", "memberNumber": "string"}
}`;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: extractionPrompt }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = fenceMatch ? fenceMatch[1] : text;
  const start = jsonStr.indexOf('{');
  const end = jsonStr.lastIndexOf('}');

  if (start === -1 || end === -1) {
    return {};
  }

  try {
    return JSON.parse(jsonStr.slice(start, end + 1)) as PatientProfileData;
  } catch {
    return {};
  }
}
