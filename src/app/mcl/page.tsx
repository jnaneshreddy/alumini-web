import type { Metadata } from "next";
import { MclArchive } from "@/components/mcl-public";
import { prisma } from "@/lib/prisma";
import { mclSeasonInclude, serializeMclSeason } from "@/lib/mcl";

export const metadata: Metadata = {
  title: "MCL — Morarji Cricket League",
  description: "Explore the verified season history, teams, awards and memories of the Morarji Cricket League.",
};

export default async function MclPage() {
  const seasons = await prisma.mclSeason.findMany({ where: { isPublished: true }, orderBy: { year: "desc" }, include: mclSeasonInclude }).catch(() => []);
  return <MclArchive seasons={seasons.map(serializeMclSeason)}/>;
}
