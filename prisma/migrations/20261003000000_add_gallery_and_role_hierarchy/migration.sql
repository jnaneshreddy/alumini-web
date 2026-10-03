-- Consolidate the original specialist roles into the requested three-level hierarchy.
ALTER TABLE "user_profiles" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Role" RENAME TO "Role_legacy";
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'USER');
ALTER TABLE "user_profiles"
  ALTER COLUMN "role" TYPE "Role"
  USING (
    CASE
      WHEN "role"::text = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
      WHEN "role"::text = 'VIEWER' THEN 'USER'
      ELSE 'ADMIN'
    END
  )::"Role";
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DEFAULT 'USER';
DROP TYPE "Role_legacy";

CREATE TYPE "GalleryType" AS ENUM ('PHOTO_GALLERY', 'MEMORY');
CREATE TYPE "GalleryCategory" AS ENUM ('SCHOOL_MEMORIES', 'CAMPUS', 'EVENTS', 'ALUMNI', 'REUNIONS', 'TEACHERS', 'STUDENT_LIFE');

ALTER TABLE "user_profiles"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "batch" TEXT,
  ADD COLUMN "avatarUrl" TEXT;

CREATE TABLE "gallery_images" (
  "id" TEXT NOT NULL,
  "titleEn" TEXT,
  "titleKn" TEXT,
  "descriptionEn" TEXT,
  "descriptionKn" TEXT,
  "altText" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "storagePath" TEXT,
  "thumbnailUrl" TEXT,
  "category" "GalleryCategory" NOT NULL DEFAULT 'SCHOOL_MEMORIES',
  "galleryType" "GalleryType" NOT NULL DEFAULT 'PHOTO_GALLERY',
  "eventId" TEXT,
  "date" TIMESTAMP(3),
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gallery_images_storagePath_key" ON "gallery_images"("storagePath");
CREATE INDEX "gallery_images_galleryType_isPublished_isFeatured_sortOrder_idx" ON "gallery_images"("galleryType", "isPublished", "isFeatured", "sortOrder");
CREATE INDEX "gallery_images_category_isPublished_idx" ON "gallery_images"("category", "isPublished");
CREATE INDEX "gallery_images_eventId_idx" ON "gallery_images"("eventId");

ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense in depth for direct Supabase Data API access. Prisma's trusted server
-- connection and Supabase service role continue to perform privileged mutations.
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT "role"::text
  FROM public.user_profiles
  WHERE "authUserId" = auth.uid()::text AND "active" = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;

ALTER TABLE "gallery_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published gallery images are public"
  ON "gallery_images" FOR SELECT
  USING ("isPublished" = true OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "administrators manage gallery images"
  ON "gallery_images" FOR ALL TO authenticated
  USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'))
  WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "users read own profile and administrators read profiles"
  ON "user_profiles" FOR SELECT TO authenticated
  USING ("authUserId" = auth.uid()::text OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "administrators read audit logs"
  ON "audit_logs" FOR SELECT TO authenticated
  USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
