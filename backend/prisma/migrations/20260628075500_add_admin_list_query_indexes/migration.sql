-- CreateIndex
CREATE INDEX "Booking_tenantId_status_createdAt_idx" ON "Booking"("tenantId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Booking_tenantId_salesAdminId_status_createdAt_idx" ON "Booking"("tenantId", "salesAdminId", "status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "booking_verifications_tenantId_status_updatedAt_idx" ON "booking_verifications"("tenantId", "status", "updatedAt" DESC);
