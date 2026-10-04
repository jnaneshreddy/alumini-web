import "server-only";
import type { Prisma } from "@prisma/client";

export const mclSeasonInclude = {
  championTeam: true,
  runnerUpTeam: true,
  thirdPlaceTeam: true,
  teams: { orderBy: [{ finalPosition: "asc" }, { nameEn: "asc" }], include: { rosters: { include: { player: true }, orderBy: { player: { nameEn: "asc" } } } } },
  awards: { where: { isPublished: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], include: { player: true, team: true } },
  memories: { where: { isPublished: true }, orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] },
} satisfies Prisma.MclSeasonInclude;

type SeasonPayload = Prisma.MclSeasonGetPayload<{ include: typeof mclSeasonInclude }>;

export type PublicMclSeason = ReturnType<typeof serializeMclSeason>;

function statisticSummary(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const summary = (value as Record<string, unknown>).summary;
  return typeof summary === "string" ? summary : null;
}

export function serializeMclSeason(season: SeasonPayload) {
  return {
    id: season.id, year: season.year, titleEn: season.titleEn, titleKn: season.titleKn,
    descriptionEn: season.descriptionEn, descriptionKn: season.descriptionKn, detailedEn: season.detailedEn, detailedKn: season.detailedKn,
    coverImageUrl: season.coverImageUrl, logoUrl: season.logoUrl, startDate: season.startDate?.toISOString() ?? null, endDate: season.endDate?.toISOString() ?? null,
    venueEn: season.venueEn, venueKn: season.venueKn, status: season.status, verifiedStatistics: season.verifiedStatistics,
    championTeam: season.championTeam ? { id: season.championTeam.id, nameEn: season.championTeam.nameEn, nameKn: season.championTeam.nameKn, logoUrl: season.championTeam.logoUrl } : null,
    runnerUpTeam: season.runnerUpTeam ? { id: season.runnerUpTeam.id, nameEn: season.runnerUpTeam.nameEn, nameKn: season.runnerUpTeam.nameKn, logoUrl: season.runnerUpTeam.logoUrl } : null,
    thirdPlaceTeam: season.thirdPlaceTeam ? { id: season.thirdPlaceTeam.id, nameEn: season.thirdPlaceTeam.nameEn, nameKn: season.thirdPlaceTeam.nameKn, logoUrl: season.thirdPlaceTeam.logoUrl } : null,
    teams: season.teams.map((team) => ({ id: team.id, nameEn: team.nameEn, nameKn: team.nameKn, descriptionEn: team.descriptionEn, descriptionKn: team.descriptionKn, captain: team.captain, logoUrl: team.logoUrl, finalPosition: team.finalPosition, matchesPlayed: team.matchesPlayed, wins: team.wins, losses: team.losses, points: team.points, runs: team.runs, wickets: team.wickets, players: team.rosters.map((roster) => ({ id: roster.id, jerseyNumber: roster.jerseyNumber, role: roster.role, player: { id: roster.player.id, nameEn: roster.player.nameEn, nameKn: roster.player.nameKn } })) })),
    awards: season.awards.map((award) => ({ id: award.id, awardNameEn: award.awardNameEn, awardNameKn: award.awardNameKn, descriptionEn: award.descriptionEn, descriptionKn: award.descriptionKn, imageUrl: award.awardImageUrl, statistics: statisticSummary(award.statistics), player: award.player ? { id: award.player.id, nameEn: award.player.nameEn, nameKn: award.player.nameKn } : null, team: award.team ? { id: award.team.id, nameEn: award.team.nameEn, nameKn: award.team.nameKn, logoUrl: award.team.logoUrl } : null })),
    memories: season.memories.map((memory) => ({ id: memory.id, imageUrl: memory.imageUrl, captionEn: memory.captionEn, captionKn: memory.captionKn, altText: memory.altText, category: memory.category, date: memory.date?.toISOString() ?? null, isFeatured: memory.isFeatured })),
  };
}
