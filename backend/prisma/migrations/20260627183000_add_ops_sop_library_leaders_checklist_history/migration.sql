-- CreateEnum
CREATE TYPE "OpsLeaderType" AS ENUM ('INTERNAL', 'FREELANCE');
CREATE TYPE "OpsIncidentType" AS ENUM ('MEDICAL', 'LOST_LUGGAGE', 'HOTEL_ISSUE', 'TRANSPORT_ISSUE', 'GUEST_CONFLICT', 'DOCUMENT_ISSUE', 'OTHER');
CREATE TYPE "OpsIncidentStatus" AS ENUM ('OPEN', 'RESOLVED');
CREATE TYPE "OpsChecklistAction" AS ENUM ('COMPLETE', 'REOPEN');
CREATE TYPE "OpsLeaderActivityAction" AS ENUM ('ASSIGN', 'UPDATE', 'ARCHIVE', 'RESTORE');
CREATE TYPE "OpsIncidentActivityAction" AS ENUM ('CREATE', 'UPDATE', 'RESOLVE', 'REOPEN', 'COMMENT');

-- AlterTable for OpsSopLibrary
ALTER TABLE "OpsSopLibrary" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OpsSopLibrary" ADD COLUMN "createdById" TEXT;
ALTER TABLE "OpsSopLibrary" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "OpsSopLibrary" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "OpsSopLibrary" ADD COLUMN "archivedById" TEXT;

ALTER TABLE "OpsSopLibrary" ADD CONSTRAINT "OpsSopLibrary_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsSopLibrary" ADD CONSTRAINT "OpsSopLibrary_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsSopLibrary" ADD CONSTRAINT "OpsSopLibrary_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable for OpsTripLeader
ALTER TABLE "OpsTripLeader" DROP CONSTRAINT IF EXISTS "OpsTripLeader_tripId_departureDate_key";
ALTER TABLE "OpsTripLeader" ALTER COLUMN "leaderType" DROP DEFAULT;
ALTER TABLE "OpsTripLeader" ALTER COLUMN "leaderType" TYPE "OpsLeaderType" USING "leaderType"::"OpsLeaderType";
ALTER TABLE "OpsTripLeader" ALTER COLUMN "leaderType" SET DEFAULT 'INTERNAL';
ALTER TABLE "OpsTripLeader" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OpsTripLeader" ADD COLUMN "assignedById" TEXT;
ALTER TABLE "OpsTripLeader" ADD COLUMN "updatedById" TEXT;
ALTER TABLE "OpsTripLeader" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "OpsTripLeader" ADD COLUMN "archivedById" TEXT;

ALTER TABLE "OpsTripLeader" ADD CONSTRAINT "OpsTripLeader_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsTripLeader" ADD CONSTRAINT "OpsTripLeader_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsTripLeader" ADD CONSTRAINT "OpsTripLeader_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "OpsTripLeader_tenantId_tripId_departureDate_leaderPhone_key" ON "OpsTripLeader"("tenantId", "tripId", "departureDate", "leaderPhone");
CREATE INDEX "OpsTripLeader_tenantId_tripId_departureDate_idx" ON "OpsTripLeader"("tenantId", "tripId", "departureDate");

-- AlterTable for OpsIncidentLog
ALTER TABLE "OpsIncidentLog" ALTER COLUMN "incidentType" TYPE "OpsIncidentType" USING "incidentType"::"OpsIncidentType";
ALTER TABLE "OpsIncidentLog" ALTER COLUMN "incidentType" SET DEFAULT 'OTHER';
ALTER TABLE "OpsIncidentLog" ALTER COLUMN "status" TYPE "OpsIncidentStatus" USING "status"::"OpsIncidentStatus";
ALTER TABLE "OpsIncidentLog" ALTER COLUMN "status" SET DEFAULT 'OPEN';
ALTER TABLE "OpsIncidentLog" ADD COLUMN "resolvedById" TEXT;
ALTER TABLE "OpsIncidentLog" ADD COLUMN "resolvedAt" TIMESTAMP(3);

ALTER TABLE "OpsIncidentLog" ADD CONSTRAINT "OpsIncidentLog_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable for OpsChecklistActivity
CREATE TABLE "OpsChecklistActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "checklistItemId" TEXT NOT NULL,
    "action" "OpsChecklistAction" NOT NULL,
    "previousStatus" BOOLEAN NOT NULL,
    "nextStatus" BOOLEAN NOT NULL,
    "notes" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsChecklistActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OpsChecklistActivity" ADD CONSTRAINT "OpsChecklistActivity_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "OpsTripChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsChecklistActivity" ADD CONSTRAINT "OpsChecklistActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OpsChecklistActivity_tenantId_idx" ON "OpsChecklistActivity"("tenantId");
CREATE INDEX "OpsChecklistActivity_checklistItemId_idx" ON "OpsChecklistActivity"("checklistItemId");

-- CreateTable for OpsIncidentActivity
CREATE TABLE "OpsIncidentActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "incidentId" TEXT NOT NULL,
    "action" "OpsIncidentActivityAction" NOT NULL,
    "notes" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsIncidentActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OpsIncidentActivity" ADD CONSTRAINT "OpsIncidentActivity_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "OpsIncidentLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsIncidentActivity" ADD CONSTRAINT "OpsIncidentActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OpsIncidentActivity_tenantId_idx" ON "OpsIncidentActivity"("tenantId");
CREATE INDEX "OpsIncidentActivity_incidentId_idx" ON "OpsIncidentActivity"("incidentId");

-- CreateTable for OpsTripLeaderActivity
CREATE TABLE "OpsTripLeaderActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "leaderAssignmentId" TEXT NOT NULL,
    "action" "OpsLeaderActivityAction" NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "notes" TEXT,
    "actorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsTripLeaderActivity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "OpsTripLeaderActivity" ADD CONSTRAINT "OpsTripLeaderActivity_leaderAssignmentId_fkey" FOREIGN KEY ("leaderAssignmentId") REFERENCES "OpsTripLeader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpsTripLeaderActivity" ADD CONSTRAINT "OpsTripLeaderActivity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "OpsTripLeaderActivity_tenantId_idx" ON "OpsTripLeaderActivity"("tenantId");
CREATE INDEX "OpsTripLeaderActivity_leaderAssignmentId_idx" ON "OpsTripLeaderActivity"("leaderAssignmentId");
