-- CreateIndex
CREATE INDEX "lab_results_consultationId_idx" ON "lab_results"("consultationId");

-- CreateIndex
CREATE INDEX "prescriptions_consultationId_idx" ON "prescriptions"("consultationId");
