-- Durable state for the deployed beta server: patient history sessions and
-- facility protocols survive redeploys/restarts once DATABASE_URL is set.

CREATE TABLE "beta_sessions" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "department" TEXT,
    "ageSex" TEXT,
    "chiefComplaintHint" TEXT,
    "summary" TEXT,
    "history" TEXT,
    "complaints" JSONB,
    "messages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beta_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facility_protocols" (
    "id" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceFilename" TEXT,
    "charCount" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_protocols_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beta_sessions_updatedAt_idx" ON "beta_sessions"("updatedAt");

-- CreateIndex
CREATE INDEX "facility_protocols_dept_idx" ON "facility_protocols"("dept");

