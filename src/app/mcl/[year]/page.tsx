import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MclSeasonDetail } from "@/components/mcl-public";
import { prisma } from "@/lib/prisma";
import { mclSeasonInclude, serializeMclSeason } from "@/lib/mcl";

type Props = { params: Promise<{ year: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const year = Number.parseInt((await params).year, 10);
  const season = Number.isInteger(year) ? await prisma.mclSeason.findFirst({ where: { year, isPublished: true }, select: { year: true, titleEn: true, descriptionEn: true } }).catch(() => null) : null;
  if (!season) return { title: "MCL season" };
  return { title: `${season.titleEn} — MCL ${season.year}`, description: season.descriptionEn || `Verified records and memories from MCL ${season.year}.` };
}

export default async function MclSeasonPage({ params }: Props) {
  const year = Number.parseInt((await params).year, 10);
  if (!Number.isInteger(year)) notFound();
  const season = await prisma.mclSeason.findFirst({ where: { year, isPublished: true }, include: mclSeasonInclude }).catch(() => null);
  if (!season) notFound();
  return <MclSeasonDetail season={serializeMclSeason(season)}/>;
}
