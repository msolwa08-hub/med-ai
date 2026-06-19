-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "PreferredLanguage" AS ENUM ('en', 'zu', 'xh', 'af', 'nso', 'tn', 'st', 'ts', 'ss', 've', 'nr');

-- CreateEnum
CREATE TYPE "HpcsaStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DoctorType" AS ENUM ('GP', 'SPECIALIST', 'ALLIED_HEALTH', 'TRAVELLING');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('HISTORY_TAKING', 'DOCTOR_REVIEW', 'EXAMINATION', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsultationType" AS ENUM ('IN_PERSON', 'TELECONSULT', 'HOME_VISIT');

-- CreateEnum
CREATE TYPE "InvestigationType" AS ENUM ('LAB', 'RADIOLOGY', 'ECG', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestigationUrgency" AS ENUM ('ROUTINE', 'URGENT', 'STAT');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('VIEW_HISTORY', 'TREATMENT', 'DATA_PROCESSING', 'RESEARCH');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'REGISTER', 'RESET_PASSWORD', 'HPCSA_VERIFY');

-- CreateEnum
CREATE TYPE "PracticeMode" AS ENUM ('OPEN_LOOP', 'CLOSED_LOOP');

-- CreateEnum
CREATE TYPE "LabProvider" AS ENUM ('LANCET', 'AMPATH', 'LAB24', 'PATHCARE', 'NHLS', 'OTHER');

-- CreateEnum
CREATE TYPE "PrescriptionStatus" AS ENUM ('ISSUED', 'DISPENSED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PatientLiteracyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "idNumber" TEXT,
    "nationalHealthInsurance" TEXT,
    "emergencyContact" TEXT,
    "preferredLanguage" "PreferredLanguage" NOT NULL DEFAULT 'en',
    "consentVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctors" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "hpcsaNumber" TEXT NOT NULL,
    "hpcsaStatus" "HpcsaStatus" NOT NULL DEFAULT 'PENDING',
    "specialization" TEXT,
    "qualifications" JSONB,
    "practiceNumber" TEXT,
    "doctorType" "DoctorType" NOT NULL DEFAULT 'GP',
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "currentLat" DOUBLE PRECISION,
    "currentLng" DOUBLE PRECISION,
    "availabilityRadius" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "consultationFee" DOUBLE PRECISION,
    "profilePhoto" TEXT,
    "bio" TEXT,
    "languages" TEXT[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_availability_logs" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "isAvailable" BOOLEAN NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_availability_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ConsultationStatus" NOT NULL DEFAULT 'HISTORY_TAKING',
    "consultationType" "ConsultationType" NOT NULL DEFAULT 'IN_PERSON',
    "encryptedDataKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_histories" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "language" "PreferredLanguage" NOT NULL DEFAULT 'en',
    "literacyLevel" "PatientLiteracyLevel" NOT NULL DEFAULT 'UNKNOWN',
    "chiefComplaint" TEXT NOT NULL,
    "historyOfPresentIllness" TEXT NOT NULL,
    "pastMedicalHistory" TEXT NOT NULL,
    "medications" TEXT NOT NULL,
    "allergies" TEXT NOT NULL,
    "familyHistory" TEXT NOT NULL,
    "socialHistory" TEXT NOT NULL,
    "systemsReview" TEXT NOT NULL,
    "clinicalScores" TEXT,
    "opportunisticFindings" TEXT,
    "redFlagsIdentified" TEXT,
    "aiConversationLog" TEXT NOT NULL,
    "doctorConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "doctorNotes" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "differential_diagnoses" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "diagnoses" JSONB NOT NULL,
    "aiModel" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorReviewed" BOOLEAN NOT NULL DEFAULT false,
    "doctorSelectedDiagnosis" TEXT,
    "doctorNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "differential_diagnoses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examination_findings" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "vitalSigns" TEXT NOT NULL,
    "generalExam" TEXT NOT NULL,
    "systemicExam" TEXT NOT NULL,
    "doctorNotes" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "examination_findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "type" "InvestigationType" NOT NULL,
    "name" TEXT NOT NULL,
    "urgency" "InvestigationUrgency" NOT NULL DEFAULT 'ROUTINE',
    "specialInstructions" TEXT,
    "encryptedResult" TEXT,
    "resultDate" TIMESTAMP(3),
    "uploadedFileKey" TEXT,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "management_plans" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "medications" TEXT NOT NULL,
    "procedures" TEXT,
    "referrals" TEXT,
    "followUpDays" INTEGER,
    "followUpDate" TEXT,
    "patientInstructions" TEXT,
    "doctorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "management_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "consultationId" TEXT,
    "consentType" "ConsentType" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "deviceInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_settings" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "practiceMode" "PracticeMode" NOT NULL DEFAULT 'OPEN_LOOP',
    "cloudProvider" TEXT,
    "cloudBucket" TEXT,
    "cloudRegion" TEXT,
    "cloudAccessKey" TEXT,
    "cloudSecretKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_incentive_scores" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "completionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "streakDays" INTEGER NOT NULL DEFAULT 0,
    "priorityBoost" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_incentive_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_literacy" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "level" "PatientLiteracyLevel" NOT NULL DEFAULT 'UNKNOWN',
    "assessedAt" TIMESTAMP(3),
    "educationYears" INTEGER,
    "selfReported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "patient_literacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_profiles" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "bloodType" TEXT,
    "encryptedAllergies" TEXT,
    "encryptedMedications" TEXT,
    "encryptedConditions" TEXT,
    "encryptedContacts" TEXT,
    "organDonor" BOOLEAN NOT NULL DEFAULT false,
    "emergencyAccessToken" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_lab_accounts" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "provider" "LabProvider" NOT NULL,
    "providerPatientId" TEXT NOT NULL,
    "encryptedAccessToken" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),

    CONSTRAINT "patient_lab_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_results" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "consultationId" TEXT,
    "labAccountId" TEXT NOT NULL,
    "provider" "LabProvider" NOT NULL,
    "externalResultId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "collectedAt" TIMESTAMP(3) NOT NULL,
    "reportedAt" TIMESTAMP(3),
    "encryptedResults" TEXT NOT NULL,
    "encryptedPdfKey" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "icd10_codes" (
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "blockCode" TEXT,
    "isLeaf" BOOLEAN NOT NULL DEFAULT true,
    "parentCode" TEXT,

    CONSTRAINT "icd10_codes_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "stg_entries" (
    "id" TEXT NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "synonyms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT NOT NULL,
    "subCategory" TEXT,
    "levelOfCare" TEXT NOT NULL,
    "edition" TEXT NOT NULL DEFAULT '8th Edition 2023',
    "firstLineTreatment" JSONB NOT NULL,
    "alternativeTreatment" JSONB,
    "investigations" JSONB NOT NULL,
    "referralCriteria" TEXT,
    "redFlags" TEXT,
    "followUpAdvice" TEXT,
    "notes" TEXT,
    "saPrevalence" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stg_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "scriptNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntilDate" TIMESTAMP(3),
    "encryptedItems" TEXT NOT NULL,
    "containsDDA" BOOLEAN NOT NULL DEFAULT false,
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "repeatTotal" INTEGER NOT NULL DEFAULT 0,
    "repeatRemaining" INTEGER NOT NULL DEFAULT 0,
    "pdfS3Key" TEXT,
    "status" "PrescriptionStatus" NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "patients_userId_key" ON "patients"("userId");

-- CreateIndex
CREATE INDEX "patients_userId_idx" ON "patients"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_userId_key" ON "doctors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctors_hpcsaNumber_key" ON "doctors"("hpcsaNumber");

-- CreateIndex
CREATE INDEX "doctors_userId_idx" ON "doctors"("userId");

-- CreateIndex
CREATE INDEX "doctors_hpcsaNumber_idx" ON "doctors"("hpcsaNumber");

-- CreateIndex
CREATE INDEX "doctors_isAvailable_currentLat_currentLng_idx" ON "doctors"("isAvailable", "currentLat", "currentLng");

-- CreateIndex
CREATE INDEX "doctor_availability_logs_doctorId_timestamp_idx" ON "doctor_availability_logs"("doctorId", "timestamp");

-- CreateIndex
CREATE INDEX "consultations_patientId_idx" ON "consultations"("patientId");

-- CreateIndex
CREATE INDEX "consultations_doctorId_idx" ON "consultations"("doctorId");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_histories_consultationId_key" ON "medical_histories"("consultationId");

-- CreateIndex
CREATE INDEX "medical_histories_consultationId_idx" ON "medical_histories"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "differential_diagnoses_consultationId_key" ON "differential_diagnoses"("consultationId");

-- CreateIndex
CREATE INDEX "differential_diagnoses_consultationId_idx" ON "differential_diagnoses"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "examination_findings_consultationId_key" ON "examination_findings"("consultationId");

-- CreateIndex
CREATE INDEX "examination_findings_consultationId_idx" ON "examination_findings"("consultationId");

-- CreateIndex
CREATE INDEX "investigations_consultationId_idx" ON "investigations"("consultationId");

-- CreateIndex
CREATE UNIQUE INDEX "management_plans_consultationId_key" ON "management_plans"("consultationId");

-- CreateIndex
CREATE INDEX "management_plans_consultationId_idx" ON "management_plans"("consultationId");

-- CreateIndex
CREATE INDEX "consent_records_patientId_doctorId_consentType_idx" ON "consent_records"("patientId", "doctorId", "consentType");

-- CreateIndex
CREATE INDEX "consent_records_patientId_consultationId_idx" ON "consent_records"("patientId", "consultationId");

-- CreateIndex
CREATE INDEX "reviews_doctorId_idx" ON "reviews"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_patientId_consultationId_key" ON "reviews"("patientId", "consultationId");

-- CreateIndex
CREATE INDEX "otps_userId_purpose_idx" ON "otps"("userId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_settings_doctorId_key" ON "doctor_settings"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_incentive_scores_doctorId_key" ON "doctor_incentive_scores"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_literacy_patientId_key" ON "patient_literacy"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_profiles_patientId_key" ON "emergency_profiles"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_profiles_emergencyAccessToken_key" ON "emergency_profiles"("emergencyAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "patient_lab_accounts_patientId_provider_key" ON "patient_lab_accounts"("patientId", "provider");

-- CreateIndex
CREATE INDEX "lab_results_patientId_collectedAt_idx" ON "lab_results"("patientId", "collectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "lab_results_provider_externalResultId_key" ON "lab_results"("provider", "externalResultId");

-- CreateIndex
CREATE INDEX "icd10_codes_description_idx" ON "icd10_codes"("description");

-- CreateIndex
CREATE INDEX "icd10_codes_category_idx" ON "icd10_codes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "stg_entries_icd10Code_key" ON "stg_entries"("icd10Code");

-- CreateIndex
CREATE INDEX "stg_entries_conditionName_idx" ON "stg_entries"("conditionName");

-- CreateIndex
CREATE INDEX "stg_entries_category_idx" ON "stg_entries"("category");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_scriptNumber_key" ON "prescriptions"("scriptNumber");

-- CreateIndex
CREATE INDEX "prescriptions_patientId_issueDate_idx" ON "prescriptions"("patientId", "issueDate");

-- CreateIndex
CREATE INDEX "prescriptions_doctorId_issueDate_idx" ON "prescriptions"("doctorId", "issueDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctors" ADD CONSTRAINT "doctors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_availability_logs" ADD CONSTRAINT "doctor_availability_logs_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_histories" ADD CONSTRAINT "medical_histories_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "differential_diagnoses" ADD CONSTRAINT "differential_diagnoses_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examination_findings" ADD CONSTRAINT "examination_findings_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "management_plans" ADD CONSTRAINT "management_plans_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_settings" ADD CONSTRAINT "doctor_settings_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_incentive_scores" ADD CONSTRAINT "doctor_incentive_scores_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_literacy" ADD CONSTRAINT "patient_literacy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_profiles" ADD CONSTRAINT "emergency_profiles_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_lab_accounts" ADD CONSTRAINT "patient_lab_accounts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_labAccountId_fkey" FOREIGN KEY ("labAccountId") REFERENCES "patient_lab_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "icd10_codes" ADD CONSTRAINT "icd10_codes_parentCode_fkey" FOREIGN KEY ("parentCode") REFERENCES "icd10_codes"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stg_entries" ADD CONSTRAINT "stg_entries_icd10Code_fkey" FOREIGN KEY ("icd10Code") REFERENCES "icd10_codes"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
