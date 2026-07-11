-- CreateIndex
CREATE INDEX "TrainTicket_tenantId_approvalStatus_updatedAt_idx" ON "TrainTicket"("tenantId", "approvalStatus", "updatedAt" DESC);
