"use server";

import { revalidatePath } from "next/cache";
import type { MclSeasonStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateMclImage } from "@/lib/mcl-images";

export type MclActionResult = { ok: boolean; message: string; id?: string };
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "alumini";
const statuses: MclSeasonStatus[] = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"];
const text = (data: FormData, key: string) => String(data.get(key) ?? "").trim();
const nullableInt = (data: FormData, key: string) => { const value = text(data, key); if (!value) return null; const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; };
const nullableDate = (data: FormData, key: string) => { const value = text(data, key); if (!value) return null; const parsed = new Date(`${value}T00:00:00`); return Number.isNaN(parsed.getTime()) ? null : parsed; };

function refreshMcl(year?: number) {
  revalidatePath("/");
  revalidatePath("/mcl");
  if (year) revalidatePath(`/mcl/${year}`);
  revalidatePath("/admin");
  revalidatePath("/admin/mcl");
  revalidatePath("/admin/activity");
}

function jsonObject(value: string): Prisma.InputJsonValue | undefined {
  if (!value) return undefined;
  const parsed: unknown = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("Statistics must be a valid JSON object.");
  return parsed as Prisma.InputJsonValue;
}

async function uploadImage(file: File, scope: string) {
  const validationError = await validateMclImage(file, true);
  if (validationError) throw new Error(validationError);
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `mcl/${scope}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Unable to upload this image: ${error.message}`);
  return { storagePath, imageUrl: supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl };
}

async function optionalUpload(data: FormData, key: string, scope: string) {
  const candidate = data.get(key);
  const file = candidate instanceof File ? candidate : null;
  const error = await validateMclImage(file, false);
  if (error) throw new Error(error);
  return file && file.size ? uploadImage(file, scope) : null;
}

async function removeStorage(paths: Array<string | null | undefined>) {
  const valid = paths.filter((path): path is string => Boolean(path));
  if (valid.length) await createAdminClient().storage.from(BUCKET).remove(valid);
}

export async function saveMclSeason(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(data, "id");
  const existing = id ? await prisma.mclSeason.findUnique({ where: { id }, include: { teams: { select: { id: true } } } }) : null;
  const year = Number.parseInt(text(data, "year"), 10);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1900 || year > currentYear + 5) return { ok: false, message: `Enter a valid tournament year between 1900 and ${currentYear + 5}.` };
  const titleEn = text(data, "titleEn");
  if (titleEn.length < 2) return { ok: false, message: "Tournament title in English is required." };
  const datesToBeDecided = data.get("datesToBeDecided") === "on";
  const startDate = datesToBeDecided ? null : nullableDate(data, "startDate");
  const endDate = datesToBeDecided ? null : nullableDate(data, "endDate");
  if (startDate && endDate && endDate < startDate) return { ok: false, message: "End date cannot be before the start date." };
  const statusText = text(data, "status") as MclSeasonStatus;
  const status = statuses.includes(statusText) ? statusText : "PLANNED";
  let statistics: Prisma.InputJsonValue | undefined;
  try { statistics = jsonObject(text(data, "verifiedStatistics")); } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Invalid statistics." }; }
  let cover: Awaited<ReturnType<typeof optionalUpload>> = null;
  let logo: Awaited<ReturnType<typeof optionalUpload>> = null;
  try {
    cover = await optionalUpload(data, "coverImage", `seasons/${year}/cover`);
    logo = await optionalUpload(data, "logoImage", `seasons/${year}/logo`);
    const teamIds = new Set(existing?.teams.map((team) => team.id) ?? []);
    const teamId = (key: string) => { const value = text(data, key); return value && teamIds.has(value) ? value : null; };
    const values = {
      year, titleEn, titleKn: text(data, "titleKn") || null,
      descriptionEn: text(data, "descriptionEn") || null, descriptionKn: text(data, "descriptionKn") || null,
      detailedEn: text(data, "detailedEn") || null, detailedKn: text(data, "detailedKn") || null,
      startDate, endDate, datesToBeDecided, venueEn: text(data, "venueEn") || null, venueKn: text(data, "venueKn") || null,
      status, isPublished: data.get("isPublished") === "on", verifiedStatistics: statistics,
      championTeamId: teamId("championTeamId"), runnerUpTeamId: teamId("runnerUpTeamId"), thirdPlaceTeamId: teamId("thirdPlaceTeamId"),
      coverImageUrl: cover?.imageUrl ?? existing?.coverImageUrl ?? null, coverStoragePath: cover?.storagePath ?? existing?.coverStoragePath ?? null,
      logoUrl: logo?.imageUrl ?? existing?.logoUrl ?? null, logoStoragePath: logo?.storagePath ?? existing?.logoStoragePath ?? null,
      updatedById: actor.id,
    };
    const season = existing
      ? await prisma.mclSeason.update({ where: { id: existing.id }, data: values })
      : await prisma.mclSeason.create({ data: { ...values, createdById: actor.id } });
    const logs: Prisma.AuditLogCreateManyInput[] = [{ userId: actor.id, action: existing ? "MCL_SEASON_UPDATED" : "MCL_SEASON_CREATED", entityType: "MclSeason", entityId: season.id, oldData: existing ? { year: existing.year, titleEn: existing.titleEn, titleKn: existing.titleKn, descriptionEn: existing.descriptionEn, descriptionKn: existing.descriptionKn, detailedEn: existing.detailedEn, detailedKn: existing.detailedKn, startDate: existing.startDate?.toISOString() ?? null, endDate: existing.endDate?.toISOString() ?? null, datesToBeDecided: existing.datesToBeDecided, venueEn: existing.venueEn, venueKn: existing.venueKn, status: existing.status, isPublished: existing.isPublished, championTeamId: existing.championTeamId, runnerUpTeamId: existing.runnerUpTeamId, thirdPlaceTeamId: existing.thirdPlaceTeamId, coverImageUrl: existing.coverImageUrl, logoUrl: existing.logoUrl } : undefined, newData: { year: season.year, titleEn: season.titleEn, titleKn: season.titleKn, descriptionEn: season.descriptionEn, descriptionKn: season.descriptionKn, detailedEn: season.detailedEn, detailedKn: season.detailedKn, startDate: season.startDate?.toISOString() ?? null, endDate: season.endDate?.toISOString() ?? null, datesToBeDecided: season.datesToBeDecided, venueEn: season.venueEn, venueKn: season.venueKn, status: season.status, isPublished: season.isPublished, championTeamId: season.championTeamId, runnerUpTeamId: season.runnerUpTeamId, thirdPlaceTeamId: season.thirdPlaceTeamId, coverImageUrl: season.coverImageUrl, logoUrl: season.logoUrl } }];
    if (existing && existing.isPublished !== season.isPublished) logs.push({ userId: actor.id, action: season.isPublished ? "MCL_SEASON_PUBLISHED" : "MCL_SEASON_UNPUBLISHED", entityType: "MclSeason", entityId: season.id, oldData: { isPublished: existing.isPublished }, newData: { isPublished: season.isPublished } });
    await prisma.auditLog.createMany({ data: logs });
    if (cover && existing?.coverStoragePath) await removeStorage([existing.coverStoragePath]);
    if (logo && existing?.logoStoragePath) await removeStorage([existing.logoStoragePath]);
    refreshMcl(year);
    return { ok: true, message: existing ? "MCL season updated." : "MCL season created.", id: season.id };
  } catch (error) {
    await removeStorage([cover?.storagePath, logo?.storagePath]);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save this MCL season." };
  }
}

export async function deleteMclSeason(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(data, "id");
  const season = id ? await prisma.mclSeason.findUnique({ where: { id }, include: { teams: true, memories: true, awards: true, rosters: { include: { player: true } } } }) : null;
  if (!season) return { ok: false, message: "MCL season not found." };
  const paths = [season.coverStoragePath, season.logoStoragePath, ...season.teams.map((team) => team.logoStoragePath), ...season.memories.map((memory) => memory.storagePath), ...season.awards.map((award) => award.awardStoragePath)];
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_SEASON_DELETED", entityType: "MclSeason", entityId: season.id, oldData: { year: season.year, titleEn: season.titleEn } } }),
    prisma.mclSeason.delete({ where: { id: season.id } }),
  ]);
  await removeStorage(paths);
  refreshMcl(season.year);
  return { ok: true, message: `MCL ${season.year} was deleted.` };
}

export async function saveMclTeam(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(data, "id");
  const seasonId = text(data, "seasonId");
  const season = await prisma.mclSeason.findUnique({ where: { id: seasonId } });
  const existing = id ? await prisma.mclTeam.findUnique({ where: { id } }) : null;
  if (!season || (existing && existing.seasonId !== seasonId)) return { ok: false, message: "MCL season or team not found." };
  const nameEn = text(data, "nameEn");
  if (!nameEn) return { ok: false, message: "Team name is required." };
  let logo: Awaited<ReturnType<typeof optionalUpload>> = null;
  try {
    logo = await optionalUpload(data, "logoImage", `seasons/${season.year}/teams`);
    const removeLogo = data.get("removeLogo") === "true";
    const values = { seasonId, nameEn, nameKn: text(data, "nameKn") || null, descriptionEn: text(data, "descriptionEn") || null, descriptionKn: text(data, "descriptionKn") || null, captain: text(data, "captain") || null, finalPosition: nullableInt(data, "finalPosition"), matchesPlayed: nullableInt(data, "matchesPlayed"), wins: nullableInt(data, "wins"), losses: nullableInt(data, "losses"), points: nullableInt(data, "points"), runs: nullableInt(data, "runs"), wickets: nullableInt(data, "wickets"), logoUrl: logo?.imageUrl ?? (removeLogo ? null : existing?.logoUrl ?? null), logoStoragePath: logo?.storagePath ?? (removeLogo ? null : existing?.logoStoragePath ?? null) };
    const team = existing ? await prisma.mclTeam.update({ where: { id }, data: values }) : await prisma.mclTeam.create({ data: values });
    await prisma.auditLog.create({ data: { userId: actor.id, action: existing ? "MCL_TEAM_UPDATED" : "MCL_TEAM_CREATED", entityType: "MclTeam", entityId: team.id, oldData: existing ? { nameEn: existing.nameEn, nameKn: existing.nameKn, descriptionEn: existing.descriptionEn, descriptionKn: existing.descriptionKn, captain: existing.captain, finalPosition: existing.finalPosition, matchesPlayed: existing.matchesPlayed, wins: existing.wins, losses: existing.losses, points: existing.points, runs: existing.runs, wickets: existing.wickets, logoUrl: existing.logoUrl } : undefined, newData: { nameEn: team.nameEn, nameKn: team.nameKn, descriptionEn: team.descriptionEn, descriptionKn: team.descriptionKn, captain: team.captain, finalPosition: team.finalPosition, matchesPlayed: team.matchesPlayed, wins: team.wins, losses: team.losses, points: team.points, runs: team.runs, wickets: team.wickets, logoUrl: team.logoUrl } } });
    if ((logo || removeLogo) && existing?.logoStoragePath) await removeStorage([existing.logoStoragePath]);
    refreshMcl(season.year);
    return { ok: true, message: existing ? "Team updated." : "Team added.", id: team.id };
  } catch (error) {
    await removeStorage([logo?.storagePath]);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save this team." };
  }
}

export async function deleteMclTeam(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(data, "id");
  const team = id ? await prisma.mclTeam.findUnique({ where: { id }, include: { season: true } }) : null;
  if (!team) return { ok: false, message: "Team not found." };
  await prisma.$transaction([prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_TEAM_DELETED", entityType: "MclTeam", entityId: id, oldData: { nameEn: team.nameEn, seasonId: team.seasonId } } }), prisma.mclTeam.delete({ where: { id } })]);
  await removeStorage([team.logoStoragePath]); refreshMcl(team.season.year);
  return { ok: true, message: "Team deleted." };
}

export async function saveMclPlayer(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles);
  const rosterId = text(data, "rosterId");
  const seasonId = text(data, "seasonId");
  const teamId = text(data, "teamId");
  const [season, team, roster] = await Promise.all([prisma.mclSeason.findUnique({ where: { id: seasonId } }), prisma.mclTeam.findUnique({ where: { id: teamId } }), rosterId ? prisma.mclRoster.findUnique({ where: { id: rosterId }, include: { player: true } }) : null]);
  if (!season || !team || team.seasonId !== seasonId || (roster && roster.seasonId !== seasonId)) return { ok: false, message: "Season, team or player record is invalid." };
  const selectedPlayerId = text(data, "existingPlayerId");
  const nameEn = text(data, "nameEn");
  if (!roster && !selectedPlayerId && !nameEn) return { ok: false, message: "Choose an existing player or enter a player name." };
  const selectedPlayer = !roster && selectedPlayerId ? await prisma.mclPlayer.findUnique({ where: { id: selectedPlayerId } }) : null;
  if (!roster && selectedPlayerId && !selectedPlayer) return { ok: false, message: "The selected reusable player could not be found." };
  if (selectedPlayer && await prisma.mclRoster.findFirst({ where: { seasonId, playerId: selectedPlayer.id } })) return { ok: false, message: "This player is already part of the selected season." };
  try {
    let playerId = roster?.playerId || selectedPlayerId;
    if (roster) {
      await prisma.mclPlayer.update({ where: { id: roster.playerId }, data: { nameEn: nameEn || roster.player.nameEn, nameKn: text(data, "nameKn") || null, alumniProfileId: text(data, "alumniProfileId") || null } });
    } else if (selectedPlayer) {
      await prisma.mclPlayer.update({ where: { id: selectedPlayer.id }, data: { nameEn: nameEn || selectedPlayer.nameEn, nameKn: text(data, "nameKn") || selectedPlayer.nameKn, alumniProfileId: text(data, "alumniProfileId") || selectedPlayer.alumniProfileId } });
    } else if (!playerId) {
      const player = await prisma.mclPlayer.create({ data: { nameEn, nameKn: text(data, "nameKn") || null, alumniProfileId: text(data, "alumniProfileId") || null } });
      playerId = player.id;
    }
    if (!playerId) throw new Error("Player could not be resolved.");
    const values = { seasonId, teamId, playerId, jerseyNumber: nullableInt(data, "jerseyNumber"), role: text(data, "role") || null };
    const saved = roster ? await prisma.mclRoster.update({ where: { id: roster.id }, data: values }) : await prisma.mclRoster.create({ data: values });
    await prisma.auditLog.create({ data: { userId: actor.id, action: roster ? "MCL_PLAYER_UPDATED" : "MCL_PLAYER_ADDED", entityType: "MclRoster", entityId: saved.id, oldData: roster ? { nameEn: roster.player.nameEn, nameKn: roster.player.nameKn, alumniProfileId: roster.player.alumniProfileId, teamId: roster.teamId, jerseyNumber: roster.jerseyNumber, role: roster.role } : undefined, newData: { nameEn: nameEn || roster?.player.nameEn || selectedPlayer?.nameEn, nameKn: text(data, "nameKn") || null, alumniProfileId: text(data, "alumniProfileId") || null, teamId: saved.teamId, jerseyNumber: saved.jerseyNumber, role: saved.role } } });
    refreshMcl(season.year);
    return { ok: true, message: roster ? "Player entry updated." : "Player added to the season.", id: saved.id };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save this player." };
  }
}

export async function deleteMclPlayer(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const id = text(data, "id");
  const roster = id ? await prisma.mclRoster.findUnique({ where: { id }, include: { season: true, player: { include: { rosters: true, awards: true } } } }) : null;
  if (!roster) return { ok: false, message: "Player entry not found." };
  await prisma.$transaction([prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_PLAYER_REMOVED", entityType: "MclRoster", entityId: id, oldData: { seasonId: roster.seasonId, teamId: roster.teamId, playerId: roster.playerId } } }), prisma.mclRoster.delete({ where: { id } })]);
  if (roster.player.rosters.length === 1 && roster.player.awards.length === 0) { await prisma.mclPlayer.delete({ where: { id: roster.playerId } }); await removeStorage([roster.player.photoStoragePath]); }
  refreshMcl(roster.season.year); return { ok: true, message: "Player removed from this season." };
}

export async function saveMclAward(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const id = text(data, "id"); const seasonId = text(data, "seasonId");
  const season = await prisma.mclSeason.findUnique({ where: { id: seasonId }, include: { teams: { select: { id: true } }, rosters: { select: { playerId: true } } } });
  const existing = id ? await prisma.mclAward.findUnique({ where: { id } }) : null;
  if (!season || (existing && existing.seasonId !== seasonId)) return { ok: false, message: "Season or award not found." };
  const awardNameEn = text(data, "awardNameEn"); if (!awardNameEn) return { ok: false, message: "Award name is required." };
  const teamId = text(data, "teamId") || null; const playerId = text(data, "playerId") || null;
  if (teamId && !season.teams.some((team) => team.id === teamId)) return { ok: false, message: "Choose a team from this season." };
  if (playerId && !season.rosters.some((roster) => roster.playerId === playerId)) return { ok: false, message: "Choose a player from this season." };
  let image: Awaited<ReturnType<typeof optionalUpload>> = null;
  try {
    image = await optionalUpload(data, "awardImage", `seasons/${season.year}/awards`);
    const summary = text(data, "statistics");
    const values = { seasonId, awardNameEn, awardNameKn: text(data, "awardNameKn") || null, descriptionEn: text(data, "descriptionEn") || null, descriptionKn: text(data, "descriptionKn") || null, teamId, playerId, statistics: summary ? { summary } : undefined, isPublished: data.get("isPublished") === "on", sortOrder: nullableInt(data, "sortOrder") || 0, awardImageUrl: image?.imageUrl ?? existing?.awardImageUrl ?? null, awardStoragePath: image?.storagePath ?? existing?.awardStoragePath ?? null };
    const award = existing ? await prisma.mclAward.update({ where: { id }, data: values }) : await prisma.mclAward.create({ data: values });
    await prisma.auditLog.create({ data: { userId: actor.id, action: existing ? "MCL_AWARD_UPDATED" : "MCL_AWARD_CREATED", entityType: "MclAward", entityId: award.id, oldData: existing ? { awardNameEn: existing.awardNameEn, awardNameKn: existing.awardNameKn, descriptionEn: existing.descriptionEn, descriptionKn: existing.descriptionKn, teamId: existing.teamId, playerId: existing.playerId, isPublished: existing.isPublished, sortOrder: existing.sortOrder, awardImageUrl: existing.awardImageUrl } : undefined, newData: { awardNameEn: award.awardNameEn, awardNameKn: award.awardNameKn, descriptionEn: award.descriptionEn, descriptionKn: award.descriptionKn, teamId: award.teamId, playerId: award.playerId, isPublished: award.isPublished, sortOrder: award.sortOrder, awardImageUrl: award.awardImageUrl } } });
    if (image && existing?.awardStoragePath) await removeStorage([existing.awardStoragePath]); refreshMcl(season.year);
    return { ok: true, message: existing ? "Award updated." : "Award added.", id: award.id };
  } catch (error) { await removeStorage([image?.storagePath]); return { ok: false, message: error instanceof Error ? error.message : "Unable to save this award." }; }
}

export async function deleteMclAward(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const id = text(data, "id");
  const award = id ? await prisma.mclAward.findUnique({ where: { id }, include: { season: true } }) : null;
  if (!award) return { ok: false, message: "Award not found." };
  await prisma.$transaction([prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_AWARD_DELETED", entityType: "MclAward", entityId: id, oldData: { awardNameEn: award.awardNameEn, seasonId: award.seasonId } } }), prisma.mclAward.delete({ where: { id } })]);
  await removeStorage([award.awardStoragePath]); refreshMcl(award.season.year); return { ok: true, message: "Award deleted." };
}

export async function uploadMclMemory(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const seasonId = text(data, "seasonId");
  const season = await prisma.mclSeason.findUnique({ where: { id: seasonId } });
  if (!season) return { ok: false, message: "MCL season not found." };
  const candidate = data.get("image"); const file = candidate instanceof File ? candidate : null;
  const validationError = await validateMclImage(file, true); if (validationError || !file) return { ok: false, message: validationError || "Choose an image." };
  let upload: Awaited<ReturnType<typeof uploadImage>> | null = null;
  try {
    upload = await uploadImage(file, `seasons/${season.year}/memories`);
    const date = nullableDate(data, "date");
    const memory = await prisma.mclMemory.create({ data: { seasonId, imageUrl: upload.imageUrl, storagePath: upload.storagePath, captionEn: text(data, "captionEn") || null, captionKn: text(data, "captionKn") || null, altText: text(data, "altText") || text(data, "captionEn") || file.name.replace(/\.[^.]+$/, ""), category: text(data, "category") || "MEMORIES", date, isFeatured: data.get("isFeatured") === "on", isPublished: data.get("isPublished") === "on", sortOrder: nullableInt(data, "sortOrder") || 0, uploadedById: actor.id } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_MEMORY_UPLOADED", entityType: "MclMemory", entityId: memory.id, newData: { seasonId, category: memory.category, fileName: file.name } } });
    refreshMcl(season.year); return { ok: true, message: "MCL memory uploaded.", id: memory.id };
  } catch (error) { await removeStorage([upload?.storagePath]); return { ok: false, message: error instanceof Error ? error.message : "Unable to upload this memory." }; }
}

export async function updateMclMemory(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const id = text(data, "id");
  const memory = id ? await prisma.mclMemory.findUnique({ where: { id }, include: { season: true } }) : null;
  if (!memory) return { ok: false, message: "MCL memory not found." };
  const updated = await prisma.mclMemory.update({ where: { id }, data: { captionEn: text(data, "captionEn") || null, captionKn: text(data, "captionKn") || null, altText: text(data, "altText") || memory.altText, category: text(data, "category") || "MEMORIES", date: nullableDate(data, "date"), isFeatured: data.get("isFeatured") === "on", isPublished: data.get("isPublished") === "on", sortOrder: nullableInt(data, "sortOrder") || 0 } });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_MEMORY_UPDATED", entityType: "MclMemory", entityId: id, oldData: { captionEn: memory.captionEn, captionKn: memory.captionKn, altText: memory.altText, category: memory.category, date: memory.date?.toISOString() ?? null, isFeatured: memory.isFeatured, isPublished: memory.isPublished, sortOrder: memory.sortOrder }, newData: { captionEn: updated.captionEn, captionKn: updated.captionKn, altText: updated.altText, category: updated.category, date: updated.date?.toISOString() ?? null, isFeatured: updated.isFeatured, isPublished: updated.isPublished, sortOrder: updated.sortOrder } } });
  refreshMcl(memory.season.year); return { ok: true, message: "Memory updated." };
}

export async function deleteMclMemory(data: FormData): Promise<MclActionResult> {
  const actor = await requireRole(...adminRoles); const id = text(data, "id");
  const memory = id ? await prisma.mclMemory.findUnique({ where: { id }, include: { season: true } }) : null;
  if (!memory) return { ok: false, message: "MCL memory not found." };
  await prisma.$transaction([prisma.auditLog.create({ data: { userId: actor.id, action: "MCL_MEMORY_DELETED", entityType: "MclMemory", entityId: id, oldData: { seasonId: memory.seasonId, storagePath: memory.storagePath } } }), prisma.mclMemory.delete({ where: { id } })]);
  await removeStorage([memory.storagePath]); refreshMcl(memory.season.year); return { ok: true, message: "Memory deleted." };
}
