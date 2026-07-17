-- CreateTable
CREATE TABLE "TravelDeskWorkspace" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "readinessScore" DOUBLE PRECISION,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelDeskWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskCategory" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TravelDeskCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskArticle" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "visibility" TEXT NOT NULL DEFAULT 'INTERNAL',
    "ownerId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "publishedById" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelDeskArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskVendorLink" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "departureId" TEXT,
    "itineraryDayId" TEXT,
    "relationshipType" TEXT NOT NULL,
    "negotiatedRate" DOUBLE PRECISION,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "internalNotes" TEXT,
    "isPreferred" BOOLEAN NOT NULL DEFAULT false,
    "isBackup" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "TravelDeskVendorLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskNotice" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "departureId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "audienceRoles" JSONB,
    "requiresAcknowledgement" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "TravelDeskNotice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskLearning" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "rootCause" TEXT,
    "resolution" TEXT,
    "recommendation" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,

    CONSTRAINT "TravelDeskLearning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskAuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "performedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelDeskAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TravelDeskWorkspace_tripId_key" ON "TravelDeskWorkspace"("tripId");

-- CreateIndex
CREATE INDEX "TravelDeskWorkspace_tripId_idx" ON "TravelDeskWorkspace"("tripId");

-- CreateIndex
CREATE INDEX "TravelDeskCategory_workspaceId_idx" ON "TravelDeskCategory"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskArticle_workspaceId_idx" ON "TravelDeskArticle"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskArticle_categoryId_idx" ON "TravelDeskArticle"("categoryId");

-- CreateIndex
CREATE INDEX "TravelDeskArticle_status_idx" ON "TravelDeskArticle"("status");

-- CreateIndex
CREATE INDEX "TravelDeskVendorLink_workspaceId_idx" ON "TravelDeskVendorLink"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskVendorLink_vendorId_idx" ON "TravelDeskVendorLink"("vendorId");

-- CreateIndex
CREATE INDEX "TravelDeskVendorLink_departureId_idx" ON "TravelDeskVendorLink"("departureId");

-- CreateIndex
CREATE INDEX "TravelDeskNotice_workspaceId_idx" ON "TravelDeskNotice"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskNotice_departureId_idx" ON "TravelDeskNotice"("departureId");

-- CreateIndex
CREATE INDEX "TravelDeskNotice_status_idx" ON "TravelDeskNotice"("status");

-- CreateIndex
CREATE INDEX "TravelDeskLearning_workspaceId_idx" ON "TravelDeskLearning"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskLearning_departureId_idx" ON "TravelDeskLearning"("departureId");

-- CreateIndex
CREATE INDEX "TravelDeskAuditLog_workspaceId_idx" ON "TravelDeskAuditLog"("workspaceId");

-- CreateIndex
CREATE INDEX "TravelDeskAuditLog_entityType_entityId_idx" ON "TravelDeskAuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "TravelDeskWorkspace" ADD CONSTRAINT "TravelDeskWorkspace_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskCategory" ADD CONSTRAINT "TravelDeskCategory_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskArticle" ADD CONSTRAINT "TravelDeskArticle_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskArticle" ADD CONSTRAINT "TravelDeskArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TravelDeskCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskVendorLink" ADD CONSTRAINT "TravelDeskVendorLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskVendorLink" ADD CONSTRAINT "TravelDeskVendorLink_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskNotice" ADD CONSTRAINT "TravelDeskNotice_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskLearning" ADD CONSTRAINT "TravelDeskLearning_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskAuditLog" ADD CONSTRAINT "TravelDeskAuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "TravelDeskWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

