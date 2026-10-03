CREATE TYPE "AlumniRegistrantType" AS ENUM ('ALUMNI', 'STUDENT', 'TEACHER');

ALTER TABLE "alumni_profiles"
  ADD COLUMN "registrantType" "AlumniRegistrantType" NOT NULL DEFAULT 'ALUMNI';
