import { MclStudio } from "@/components/mcl-studio";
import { adminRoles, requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import type { MclPlayer } from "@prisma/client";

const serializePlayer = (player: MclPlayer) => ({ id: player.id, nameEn: player.nameEn, nameKn: player.nameKn, alumniProfileId: player.alumniProfileId });

export default async function MclAdminPage() {
  await requireRole(...adminRoles);
  const [seasons, players, alumni] = await Promise.all([
    prisma.mclSeason.findMany({ orderBy: { year: "desc" }, include: { championTeam: true, runnerUpTeam: true, thirdPlaceTeam: true, teams: { orderBy: [{ finalPosition: "asc" }, { nameEn: "asc" }], include: { rosters: { include: { player: true }, orderBy: { player: { nameEn: "asc" } } } } }, rosters: { include: { player: true, team: true }, orderBy: { player: { nameEn: "asc" } } }, awards: { include: { player: true, team: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }, memories: { orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] } } }),
    prisma.mclPlayer.findMany({ orderBy: { nameEn: "asc" }, select: { id: true, nameEn: true, nameKn: true, alumniProfileId: true } }),
    prisma.alumniProfile.findMany({ where: { verificationStatus: "VERIFIED" }, orderBy: { fullName: "asc" }, select: { id: true, fullName: true, batch: true } }),
  ]);
  return <section className="adminRoutePage"><MclStudio
    players={players}
    alumni={alumni}
    seasons={seasons.map((season) => ({ ...season, startDate: season.startDate?.toISOString().slice(0,10) ?? null, endDate: season.endDate?.toISOString().slice(0,10) ?? null, createdAt: season.createdAt.toISOString(), updatedAt: season.updatedAt.toISOString(), verifiedStatistics: season.verifiedStatistics ? JSON.stringify(season.verifiedStatistics, null, 2) : "", teams: season.teams.map((team) => ({ ...team, createdAt: team.createdAt.toISOString(), updatedAt: team.updatedAt.toISOString(), rosters: team.rosters.map((roster) => ({ ...roster, createdAt: roster.createdAt.toISOString(), updatedAt: roster.updatedAt.toISOString(), player: serializePlayer(roster.player) })) })), rosters: season.rosters.map((roster) => ({ ...roster, createdAt: roster.createdAt.toISOString(), updatedAt: roster.updatedAt.toISOString(), player: serializePlayer(roster.player), team: { ...roster.team, createdAt: roster.team.createdAt.toISOString(), updatedAt: roster.team.updatedAt.toISOString() } })), awards: season.awards.map((award) => ({ ...award, createdAt: award.createdAt.toISOString(), updatedAt: award.updatedAt.toISOString(), statistics: award.statistics && typeof award.statistics === "object" && !Array.isArray(award.statistics) && "summary" in award.statistics ? String(award.statistics.summary ?? "") : "", player: award.player ? serializePlayer(award.player) : null, team: award.team ? { ...award.team, createdAt: award.team.createdAt.toISOString(), updatedAt: award.team.updatedAt.toISOString() } : null })), memories: season.memories.map((memory) => ({ ...memory, date: memory.date?.toISOString().slice(0,10) ?? null, createdAt: memory.createdAt.toISOString(), updatedAt: memory.updatedAt.toISOString() })) }))}
  /></section>;
}
