-- DropIndex
DROP INDEX "TravelDeskLearning_departureId_idx";

-- DropIndex
DROP INDEX "TravelDeskNotice_departureId_idx";

-- DropIndex
DROP INDEX "TravelDeskVendorLink_departureId_idx";

-- AlterTable
ALTER TABLE "TravelDeskArticle" ADD COLUMN     "originLearningId" TEXT,
ADD COLUMN     "tags" JSONB;

-- AlterTable
ALTER TABLE "TravelDeskLearning" DROP COLUMN "departureId",
ADD COLUMN     "departureDate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TravelDeskNotice" DROP COLUMN "departureId",
ADD COLUMN     "departureDate" TEXT;

-- AlterTable
ALTER TABLE "TravelDeskVendorLink" DROP COLUMN "departureId",
ADD COLUMN     "departureDate" TEXT;

-- AlterTable
ALTER TABLE "TripDocument" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "storedFilename" TEXT;

-- AlterTable
ALTER TABLE "TripSop" ADD COLUMN     "applicableRoles" JSONB,
ADD COLUMN     "escalationPath" TEXT,
ADD COLUMN     "expectedOutput" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "requiredInputs" JSONB,
ADD COLUMN     "responsibleRole" TEXT,
ADD COLUMN     "reviewFrequency" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "trigger" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "TripSopVersion" (
    "id" TEXT NOT NULL,
    "sopId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeComment" TEXT,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripSopVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "storageKey" TEXT,
    "fileUrl" TEXT,
    "originalFilename" TEXT,
    "storedFilename" TEXT,
    "mimeType" TEXT,
    "fileSize" TEXT,
    "checksum" TEXT,
    "version" INTEGER NOT NULL,
    "metadata" JSONB,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "tags" JSONB,
    "visibility" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "authorId" TEXT,
    "changeComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelDeskArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TravelDeskNoticeAck" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TravelDeskNoticeAck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TripSopVersion_sopId_createdAt_idx" ON "TripSopVersion"("sopId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TripSopVersion_sopId_version_key" ON "TripSopVersion"("sopId", "version");

-- CreateIndex
CREATE INDEX "TripDocumentVersion_documentId_createdAt_idx" ON "TripDocumentVersion"("documentId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TripDocumentVersion_documentId_version_key" ON "TripDocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "TravelDeskArticleVersion_articleId_createdAt_idx" ON "TravelDeskArticleVersion"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TravelDeskArticleVersion_articleId_version_key" ON "TravelDeskArticleVersion"("articleId", "version");

-- CreateIndex
CREATE INDEX "TravelDeskNoticeAck_userId_acknowledgedAt_idx" ON "TravelDeskNoticeAck"("userId", "acknowledgedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TravelDeskNoticeAck_noticeId_userId_key" ON "TravelDeskNoticeAck"("noticeId", "userId");

-- CreateIndex
CREATE INDEX "TravelDeskLearning_departureDate_idx" ON "TravelDeskLearning"("departureDate");

-- CreateIndex
CREATE INDEX "TravelDeskNotice_departureDate_idx" ON "TravelDeskNotice"("departureDate");

-- CreateIndex
CREATE INDEX "TravelDeskVendorLink_departureDate_idx" ON "TravelDeskVendorLink"("departureDate");

-- AddForeignKey
ALTER TABLE "TripSopVersion" ADD CONSTRAINT "TripSopVersion_sopId_fkey" FOREIGN KEY ("sopId") REFERENCES "TripSop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDocumentVersion" ADD CONSTRAINT "TripDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TripDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskArticle" ADD CONSTRAINT "TravelDeskArticle_originLearningId_fkey" FOREIGN KEY ("originLearningId") REFERENCES "TravelDeskLearning"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskArticleVersion" ADD CONSTRAINT "TravelDeskArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "TravelDeskArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelDeskNoticeAck" ADD CONSTRAINT "TravelDeskNoticeAck_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "TravelDeskNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

