-- Dispatch + triage metadata for the patient-doctor matching layer

-- CreateEnum
CREATE TYPE "TriageUrgency" AS ENUM ('ROUTINE', 'SOON', 'URGENT', 'EMERGENCY');

-- AlterTable
ALTER TABLE "consultations" ADD COLUMN "patientLat" DOUBLE PRECISION;
ALTER TABLE "consultations" ADD COLUMN "patientLng" DOUBLE PRECISION;
ALTER TABLE "consultations" ADD COLUMN "triageUrgency" "TriageUrgency";

-- Unassigned-queue lookups filter on status + doctorId
CREATE INDEX IF NOT EXISTS "consultations_status_doctorId_idx" ON "consultations"("status", "doctorId");
