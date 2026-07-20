-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "recipientUserId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "module" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'LOW',
    "entityType" TEXT,
    "entityId" TEXT,
    "actionUrl" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "eventId" TEXT,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorUserId" TEXT,
    "actorName" TEXT,
    "comments" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "documentNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "assigneeUserId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recurrenceType" TEXT NOT NULL,
    "recurrenceValue" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "nextOccurrence" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringTaskOccurrence" (
    "id" TEXT NOT NULL,
    "recurringTaskId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringTaskOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_readAt_createdAt_idx" ON "Notification"("recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_recipientUserId_eventId_key" ON "Notification"("recipientUserId", "eventId");

-- CreateIndex
CREATE INDEX "ActivityEvent_entityType_entityId_createdAt_idx" ON "ActivityEvent"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_tenantId_createdAt_idx" ON "ActivityEvent"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CompanyDocument_tenantId_category_expiryDate_idx" ON "CompanyDocument"("tenantId", "category", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyDocumentVersion_documentId_versionNumber_key" ON "CompanyDocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "RecurringTask_tenantId_isActive_nextOccurrence_idx" ON "RecurringTask"("tenantId", "isActive", "nextOccurrence");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringTaskOccurrence_recurringTaskId_scheduledFor_key" ON "RecurringTaskOccurrence"("recurringTaskId", "scheduledFor");

-- AddForeignKey
ALTER TABLE "CompanyDocumentVersion" ADD CONSTRAINT "CompanyDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "CompanyDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringTaskOccurrence" ADD CONSTRAINT "RecurringTaskOccurrence_recurringTaskId_fkey" FOREIGN KEY ("recurringTaskId") REFERENCES "RecurringTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

