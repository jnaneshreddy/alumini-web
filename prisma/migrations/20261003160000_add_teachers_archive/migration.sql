CREATE TABLE "teachers" (
  "id" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameKn" TEXT,
  "designationEn" TEXT NOT NULL,
  "designationKn" TEXT,
  "descriptionEn" TEXT,
  "descriptionKn" TEXT,
  "imageUrl" TEXT NOT NULL,
  "storagePath" TEXT,
  "startYear" INTEGER NOT NULL,
  "endYear" INTEGER,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdById" TEXT,
  "updatedById" TEXT,
  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "teachers_tenure_check" CHECK (
    "startYear" >= 1900
    AND ("endYear" IS NULL OR "endYear" >= "startYear")
    AND (("isCurrent" = true AND "endYear" IS NULL) OR ("isCurrent" = false AND "endYear" IS NOT NULL))
  )
);

CREATE UNIQUE INDEX "teachers_storagePath_key" ON "teachers"("storagePath");
CREATE INDEX "teachers_isPublished_isCurrent_endYear_startYear_idx" ON "teachers"("isPublished", "isCurrent", "endYear", "startYear");

ALTER TABLE "teachers" ADD CONSTRAINT "teachers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published teachers are public"
  ON "teachers" FOR SELECT
  USING ("isPublished" = true OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "administrators manage teachers"
  ON "teachers" FOR ALL TO authenticated
  USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'))
  WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
