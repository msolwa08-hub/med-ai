-- Catch-up migration: everything added to the schema after the squashed init.
-- (payments, push notifications, doctor profile fields, HPCSA verification
-- timestamp, AI history depth preference, consultation indexes)

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETE', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYFAST', 'CASH');

-- CreateEnum
CREATE TYPE "AiHistoryDepth" AS ENUM ('FOCUSED', 'STANDARD', 'COMPREHENSIVE');

-- AlterTable: users — Expo push notification token
ALTER TABLE "users" ADD COLUMN "pushToken" TEXT;

-- AlterTable: doctors — profile setup fields + HPCSA verification timestamp
ALTER TABLE "doctors" ADD COLUMN "hpcsaVerifiedAt" TIMESTAMP(3);
ALTER TABLE "doctors" ADD COLUMN "languagesSpoken" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "doctors" ADD COLUMN "practiceName" TEXT;
ALTER TABLE "doctors" ADD COLUMN "practiceAddress" TEXT;

-- AlterTable: doctor_settings — AI history depth preference
ALTER TABLE "doctor_settings" ADD COLUMN "aiHistoryDepth" "AiHistoryDepth" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "amountTotal" DOUBLE PRECISION NOT NULL,
    "amountDoctor" DOUBLE PRECISION NOT NULL,
    "amountPlatform" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'PAYFAST',
    "payfastPaymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_consultationId_key" ON "payments"("consultationId");
CREATE INDEX "payments_patientId_idx" ON "payments"("patientId");
CREATE INDEX "payments_doctorId_idx" ON "payments"("doctorId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_consultationId_fkey" FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payments" ADD CONSTRAINT "payments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Consultation hot-path indexes (restored from the squashed migration set)
CREATE INDEX IF NOT EXISTS "consultations_doctorId_status_idx" ON "consultations"("doctorId", "status");
CREATE INDEX IF NOT EXISTS "consultations_patientId_status_idx" ON "consultations"("patientId", "status");
