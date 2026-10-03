-- CreateEnum
CREATE TYPE "AlumniVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "alumni_profiles" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "batch" TEXT NOT NULL,
    "graduationYear" INTEGER,
    "city" TEXT,
    "profession" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "consentToPublish" BOOLEAN NOT NULL DEFAULT false,
    "consentRecordedAt" TIMESTAMP(3),
    "verificationStatus" "AlumniVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'SYSTEM',
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL DEFAULT 'Morarji Desai Residential School',
    "portalName" TEXT NOT NULL DEFAULT 'MDRS Alumni',
    "supportEmail" TEXT,
    "supportPhone" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "notifyFeedback" BOOLEAN NOT NULL DEFAULT true,
    "notifyAlumni" BOOLEAN NOT NULL DEFAULT true,
    "notifyAccess" BOOLEAN NOT NULL DEFAULT true,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alumni_profiles_batch_verificationStatus_idx" ON "alumni_profiles"("batch", "verificationStatus");

-- CreateIndex
CREATE INDEX "alumni_profiles_isPublished_verificationStatus_idx" ON "alumni_profiles"("isPublished", "verificationStatus");

-- CreateIndex
CREATE INDEX "admin_notifications_recipientId_clearedAt_createdAt_idx" ON "admin_notifications"("recipientId", "clearedAt", "createdAt");

-- CreateIndex
CREATE INDEX "admin_notifications_recipientId_readAt_idx" ON "admin_notifications"("recipientId", "readAt");

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the single editable institutional settings record.
INSERT INTO "site_settings" ("id", "updatedAt") VALUES ('primary', CURRENT_TIMESTAMP);
