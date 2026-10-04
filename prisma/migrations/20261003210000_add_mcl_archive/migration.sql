CREATE TYPE "MclSeasonStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

CREATE TABLE "mcl_seasons" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "year" INTEGER NOT NULL,
  "titleEn" TEXT NOT NULL,
  "titleKn" TEXT,
  "descriptionEn" TEXT,
  "descriptionKn" TEXT,
  "detailedEn" TEXT,
  "detailedKn" TEXT,
  "coverImageUrl" TEXT,
  "coverStoragePath" TEXT,
  "logoUrl" TEXT,
  "logoStoragePath" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "venueEn" TEXT,
  "venueKn" TEXT,
  "status" "MclSeasonStatus" NOT NULL DEFAULT 'PLANNED',
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "verifiedStatistics" JSONB,
  "championTeamId" TEXT,
  "runnerUpTeamId" TEXT,
  "thirdPlaceTeamId" TEXT,
  "createdById" TEXT,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_seasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcl_teams" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameKn" TEXT,
  "descriptionEn" TEXT,
  "descriptionKn" TEXT,
  "captain" TEXT,
  "logoUrl" TEXT,
  "logoStoragePath" TEXT,
  "finalPosition" INTEGER,
  "matchesPlayed" INTEGER,
  "wins" INTEGER,
  "losses" INTEGER,
  "points" INTEGER,
  "runs" INTEGER,
  "wickets" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcl_players" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "nameEn" TEXT NOT NULL,
  "nameKn" TEXT,
  "photoUrl" TEXT,
  "photoStoragePath" TEXT,
  "alumniProfileId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_players_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcl_rosters" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "jerseyNumber" INTEGER,
  "role" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_rosters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcl_awards" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL,
  "awardNameEn" TEXT NOT NULL,
  "awardNameKn" TEXT,
  "descriptionEn" TEXT,
  "descriptionKn" TEXT,
  "playerId" TEXT,
  "teamId" TEXT,
  "statistics" JSONB,
  "awardImageUrl" TEXT,
  "awardStoragePath" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_awards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mcl_memories" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "seasonId" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "captionEn" TEXT,
  "captionKn" TEXT,
  "altText" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'MEMORIES',
  "date" TIMESTAMP(3),
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "uploadedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "mcl_memories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mcl_seasons_year_key" ON "mcl_seasons"("year");
CREATE UNIQUE INDEX "mcl_seasons_coverStoragePath_key" ON "mcl_seasons"("coverStoragePath");
CREATE UNIQUE INDEX "mcl_seasons_logoStoragePath_key" ON "mcl_seasons"("logoStoragePath");
CREATE INDEX "mcl_seasons_isPublished_year_idx" ON "mcl_seasons"("isPublished", "year");
CREATE UNIQUE INDEX "mcl_teams_logoStoragePath_key" ON "mcl_teams"("logoStoragePath");
CREATE UNIQUE INDEX "mcl_teams_seasonId_nameEn_key" ON "mcl_teams"("seasonId", "nameEn");
CREATE INDEX "mcl_teams_seasonId_finalPosition_idx" ON "mcl_teams"("seasonId", "finalPosition");
CREATE UNIQUE INDEX "mcl_players_photoStoragePath_key" ON "mcl_players"("photoStoragePath");
CREATE INDEX "mcl_players_nameEn_idx" ON "mcl_players"("nameEn");
CREATE INDEX "mcl_players_alumniProfileId_idx" ON "mcl_players"("alumniProfileId");
CREATE UNIQUE INDEX "mcl_rosters_seasonId_playerId_key" ON "mcl_rosters"("seasonId", "playerId");
CREATE INDEX "mcl_rosters_teamId_idx" ON "mcl_rosters"("teamId");
CREATE UNIQUE INDEX "mcl_awards_awardStoragePath_key" ON "mcl_awards"("awardStoragePath");
CREATE INDEX "mcl_awards_seasonId_isPublished_sortOrder_idx" ON "mcl_awards"("seasonId", "isPublished", "sortOrder");
CREATE UNIQUE INDEX "mcl_memories_storagePath_key" ON "mcl_memories"("storagePath");
CREATE INDEX "mcl_memories_seasonId_isPublished_sortOrder_idx" ON "mcl_memories"("seasonId", "isPublished", "sortOrder");
CREATE INDEX "mcl_memories_category_idx" ON "mcl_memories"("category");

ALTER TABLE "mcl_teams" ADD CONSTRAINT "mcl_teams_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "mcl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_seasons" ADD CONSTRAINT "mcl_seasons_championTeamId_fkey" FOREIGN KEY ("championTeamId") REFERENCES "mcl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_seasons" ADD CONSTRAINT "mcl_seasons_runnerUpTeamId_fkey" FOREIGN KEY ("runnerUpTeamId") REFERENCES "mcl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_seasons" ADD CONSTRAINT "mcl_seasons_thirdPlaceTeamId_fkey" FOREIGN KEY ("thirdPlaceTeamId") REFERENCES "mcl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_seasons" ADD CONSTRAINT "mcl_seasons_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_seasons" ADD CONSTRAINT "mcl_seasons_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_players" ADD CONSTRAINT "mcl_players_alumniProfileId_fkey" FOREIGN KEY ("alumniProfileId") REFERENCES "alumni_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_rosters" ADD CONSTRAINT "mcl_rosters_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "mcl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_rosters" ADD CONSTRAINT "mcl_rosters_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "mcl_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_rosters" ADD CONSTRAINT "mcl_rosters_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "mcl_players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_awards" ADD CONSTRAINT "mcl_awards_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "mcl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_awards" ADD CONSTRAINT "mcl_awards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "mcl_players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_awards" ADD CONSTRAINT "mcl_awards_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "mcl_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "mcl_memories" ADD CONSTRAINT "mcl_memories_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "mcl_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mcl_memories" ADD CONSTRAINT "mcl_memories_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mcl_seasons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcl_teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcl_players" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcl_rosters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcl_awards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mcl_memories" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published mcl seasons are public" ON "mcl_seasons" FOR SELECT TO anon, authenticated USING ("isPublished" = true OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "published mcl teams are public" ON "mcl_teams" FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM "mcl_seasons" s WHERE s."id" = "seasonId" AND s."isPublished" = true) OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "published mcl players are public" ON "mcl_players" FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM "mcl_rosters" r JOIN "mcl_seasons" s ON s."id" = r."seasonId" WHERE r."playerId" = "mcl_players"."id" AND s."isPublished" = true) OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "published mcl rosters are public" ON "mcl_rosters" FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM "mcl_seasons" s WHERE s."id" = "seasonId" AND s."isPublished" = true) OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "published mcl awards are public" ON "mcl_awards" FOR SELECT TO anon, authenticated USING ("isPublished" = true AND EXISTS (SELECT 1 FROM "mcl_seasons" s WHERE s."id" = "seasonId" AND s."isPublished" = true) OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "published mcl memories are public" ON "mcl_memories" FOR SELECT TO anon, authenticated USING ("isPublished" = true AND EXISTS (SELECT 1 FROM "mcl_seasons" s WHERE s."id" = "seasonId" AND s."isPublished" = true) OR public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "admins manage mcl seasons" ON "mcl_seasons" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "admins manage mcl teams" ON "mcl_teams" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "admins manage mcl players" ON "mcl_players" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "admins manage mcl rosters" ON "mcl_rosters" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "admins manage mcl awards" ON "mcl_awards" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
CREATE POLICY "admins manage mcl memories" ON "mcl_memories" FOR ALL TO authenticated USING (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN')) WITH CHECK (public.current_app_role() IN ('ADMIN', 'SUPER_ADMIN'));
