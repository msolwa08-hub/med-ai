-- CreateEnum
CREATE TYPE "AiHistoryDepth" AS ENUM ('FOCUSED', 'STANDARD', 'COMPREHENSIVE');

-- AlterTable
ALTER TABLE "doctor_settings" ADD COLUMN "aiHistoryDepth" "AiHistoryDepth" NOT NULL DEFAULT 'STANDARD';
