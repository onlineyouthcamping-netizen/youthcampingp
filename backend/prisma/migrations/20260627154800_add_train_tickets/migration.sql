-- CreateEnum
CREATE TYPE "TrainTicketStatus" AS ENUM ('PENDING', 'BOOKED', 'WAITLISTED', 'CONFIRMED', 'RAC', 'SELF_BOOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TrainTicketApprovalStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REOPENED');

-- CreateTable
CREATE TABLE "TrainTicket" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "bookingId" TEXT NOT NULL,
    "travelerName" TEXT NOT NULL,
    "passengerReference" TEXT,
    "pnr" TEXT,
    "trainName" TEXT,
    "trainNumber" TEXT,
    "journeyDate" TIMESTAMP(3),
    "sourceStation" TEXT,
    "destinationStation" TEXT,
    "coach" TEXT,
    "seatNumber" TEXT,
    "berthType" TEXT,
    "ticketStatus" "TrainTicketStatus" NOT NULL DEFAULT 'PENDING',
    "approvalStatus" "TrainTicketApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "ticketAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "amountMode" TEXT,
    "refundAmount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "cancellationReason" TEXT,
    "internalNote" TEXT,
    "ticketBookingPerson" TEXT,
    "supersedesTicketId" TEXT,
    "supersededByTicketId" TEXT,
    "reopenReason" TEXT,
    "submittedByAdminId" TEXT,
    "groupId" TEXT,
    "templateId" TEXT,
    "ticketFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTicketHistory" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "TrainTicketStatus",
    "toStatus" "TrainTicketStatus",
    "fromApproval" "TrainTicketApprovalStatus",
    "toApproval" "TrainTicketApprovalStatus",
    "notes" TEXT,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainTicketHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTemplate" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "tripId" TEXT,
    "tripTitle" TEXT,
    "departureDate" TIMESTAMP(3),
    "trainName" TEXT,
    "trainNumber" TEXT,
    "source" TEXT,
    "destination" TEXT,
    "defaultClass" TEXT,
    "defaultCoach" TEXT,
    "journeyDate" TIMESTAMP(3),
    "boardingPoint" TEXT,
    "droppingPoint" TEXT,
    "waitlistDisclaimer" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTicketAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "alertType" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "bookingId" TEXT,
    "ticketId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainTicketAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTicketGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "bookingId" TEXT NOT NULL,
    "label" TEXT,
    "amountMode" TEXT NOT NULL DEFAULT 'PER_PERSON',
    "groupTicketAmount" DECIMAL(10,2),
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainTicketGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTicketApproval" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "trainTicketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fromApprovalStatus" "TrainTicketApprovalStatus",
    "toApprovalStatus" "TrainTicketApprovalStatus",
    "fromTicketStatus" "TrainTicketStatus",
    "toTicketStatus" "TrainTicketStatus",
    "notes" TEXT,
    "actorAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainTicketApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainTicketAlertEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "bookingId" TEXT,
    "trainTicketId" TEXT,
    "alertType" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "recipientAdminId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "sentAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainTicketAlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrainTicket_supersedesTicketId_key" ON "TrainTicket"("supersedesTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainTicket_supersededByTicketId_key" ON "TrainTicket"("supersededByTicketId");

-- CreateIndex
CREATE INDEX "TrainTicket_tenantId_idx" ON "TrainTicket"("tenantId");

-- CreateIndex
CREATE INDEX "TrainTicket_bookingId_idx" ON "TrainTicket"("bookingId");

-- CreateIndex
CREATE INDEX "TrainTicket_pnr_idx" ON "TrainTicket"("pnr");

-- CreateIndex
CREATE INDEX "TrainTicket_ticketStatus_idx" ON "TrainTicket"("ticketStatus");

-- CreateIndex
CREATE INDEX "TrainTicket_approvalStatus_idx" ON "TrainTicket"("approvalStatus");

-- CreateIndex
CREATE INDEX "TrainTicket_journeyDate_idx" ON "TrainTicket"("journeyDate");

-- CreateIndex
CREATE INDEX "TrainTicket_tenantId_ticketStatus_journeyDate_idx" ON "TrainTicket"("tenantId", "ticketStatus", "journeyDate");

-- CreateIndex
CREATE INDEX "TrainTicketHistory_ticketId_idx" ON "TrainTicketHistory"("ticketId");

-- CreateIndex
CREATE INDEX "TrainTicketHistory_ticketId_createdAt_idx" ON "TrainTicketHistory"("ticketId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrainTemplate_tripId_departureDate_source_destination_key" ON "TrainTemplate"("tripId", "departureDate", "source", "destination");

-- CreateIndex
CREATE INDEX "TrainTemplate_tenantId_idx" ON "TrainTemplate"("tenantId");

-- CreateIndex
CREATE INDEX "TrainTemplate_tripId_departureDate_idx" ON "TrainTemplate"("tripId", "departureDate");

-- CreateIndex
CREATE INDEX "TrainTicketAlert_tenantId_idx" ON "TrainTicketAlert"("tenantId");

-- CreateIndex
CREATE INDEX "TrainTicketAlert_bookingId_idx" ON "TrainTicketAlert"("bookingId");

-- CreateIndex
CREATE INDEX "TrainTicketAlert_bookingId_alertType_idx" ON "TrainTicketAlert"("bookingId", "alertType");

-- CreateIndex
CREATE INDEX "TrainTicketAlert_ticketId_idx" ON "TrainTicketAlert"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainTicketAlert_alertType_dedupeKey_key" ON "TrainTicketAlert"("alertType", "dedupeKey");

-- CreateIndex
CREATE INDEX "TrainTicketGroup_tenantId_idx" ON "TrainTicketGroup"("tenantId");

-- CreateIndex
CREATE INDEX "TrainTicketGroup_bookingId_idx" ON "TrainTicketGroup"("bookingId");

-- CreateIndex
CREATE INDEX "TrainTicketApproval_trainTicketId_createdAt_idx" ON "TrainTicketApproval"("trainTicketId", "createdAt");

-- CreateIndex
CREATE INDEX "TrainTicketApproval_tenantId_idx" ON "TrainTicketApproval"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainTicketAlertEvent_alertType_dedupeKey_key" ON "TrainTicketAlertEvent"("alertType", "dedupeKey");

-- CreateIndex
CREATE INDEX "TrainTicketAlertEvent_tenantId_idx" ON "TrainTicketAlertEvent"("tenantId");

-- CreateIndex
CREATE INDEX "TrainTicketAlertEvent_bookingId_alertType_idx" ON "TrainTicketAlertEvent"("bookingId", "alertType");

-- CreateIndex
CREATE INDEX "TrainTicketAlertEvent_trainTicketId_idx" ON "TrainTicketAlertEvent"("trainTicketId");

-- AddForeignKey
ALTER TABLE "TrainTicket" ADD CONSTRAINT "TrainTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicket" ADD CONSTRAINT "TrainTicket_supersedesTicketId_fkey" FOREIGN KEY ("supersedesTicketId") REFERENCES "TrainTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicket" ADD CONSTRAINT "TrainTicket_submittedByAdminId_fkey" FOREIGN KEY ("submittedByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicket" ADD CONSTRAINT "TrainTicket_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "TrainTicketGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketHistory" ADD CONSTRAINT "TrainTicketHistory_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "TrainTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketHistory" ADD CONSTRAINT "TrainTicketHistory_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTemplate" ADD CONSTRAINT "TrainTemplate_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketGroup" ADD CONSTRAINT "TrainTicketGroup_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("bookingId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketGroup" ADD CONSTRAINT "TrainTicketGroup_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketApproval" ADD CONSTRAINT "TrainTicketApproval_trainTicketId_fkey" FOREIGN KEY ("trainTicketId") REFERENCES "TrainTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainTicketApproval" ADD CONSTRAINT "TrainTicketApproval_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
