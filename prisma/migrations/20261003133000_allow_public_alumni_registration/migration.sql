-- Public registration requests are not created by an administrator.
ALTER TABLE "alumni_profiles" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "alumni_profiles" DROP CONSTRAINT "alumni_profiles_createdById_fkey";
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
