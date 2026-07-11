-- CreateEnum
CREATE TYPE "AccountingPaymentMode" AS ENUM ('CASH', 'UPI', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "AccountingEntryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AccountingEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "bookingId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" "AccountingPaymentMode" NOT NULL,
    "referenceNumber" TEXT,
    "status" "AccountingEntryStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "rejectionReason" TEXT,
    "salespersonId" TEXT NOT NULL,
    "actionedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingEntryLog" (
    "id" TEXT NOT NULL,
    "accountingEntryId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingEntryLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingAlertDedupe" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountingAlertDedupe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountingEntry_tenantId_idx" ON "AccountingEntry"("tenantId");

-- CreateIndex
CREATE INDEX "AccountingEntry_bookingId_idx" ON "AccountingEntry"("bookingId");

-- CreateIndex
CREATE INDEX "AccountingEntry_salespersonId_idx" ON "AccountingEntry"("salespersonId");

-- CreateIndex
CREATE INDEX "AccountingEntry_status_idx" ON "AccountingEntry"("status");

-- CreateIndex
CREATE INDEX "AccountingEntryLog_accountingEntryId_idx" ON "AccountingEntryLog"("accountingEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAlertDedupe_alertType_bookingId_key" ON "AccountingAlertDedupe"("alertType", "bookingId");

-- CreateIndex
CREATE INDEX "AccountingAlertDedupe_bookingId_idx" ON "AccountingAlertDedupe"("bookingId");

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntry" ADD CONSTRAINT "AccountingEntry_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntryLog" ADD CONSTRAINT "AccountingEntryLog_accountingEntryId_fkey" FOREIGN KEY ("accountingEntryId") REFERENCES "AccountingEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingEntryLog" ADD CONSTRAINT "AccountingEntryLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
