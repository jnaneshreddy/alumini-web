-- Add optional Kannada content without changing existing English records.
ALTER TABLE "announcements"
  ADD COLUMN "titleKn" TEXT,
  ADD COLUMN "bodyKn" TEXT;

ALTER TABLE "events"
  ADD COLUMN "titleKn" TEXT,
  ADD COLUMN "descriptionKn" TEXT,
  ADD COLUMN "venueKn" TEXT;
