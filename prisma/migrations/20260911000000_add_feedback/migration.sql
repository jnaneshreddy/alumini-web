CREATE TABLE "feedback" (
  "id" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "batch" TEXT NOT NULL,
  "alumniType" TEXT NOT NULL,
  "feedbackType" TEXT NOT NULL,
  "subject" TEXT,
  "message" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "feedback_referenceId_key" ON "feedback"("referenceId");
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");
