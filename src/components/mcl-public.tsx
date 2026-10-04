"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Shield, Trophy, Users } from "lucide-react";
import type { PublicLocale } from "@/lib/public-i18n";
import type { PublicMclSeason } from "@/lib/mcl";

const copy = {
  en: {
    kicker: "Annual cricket heritage", title: "MCL — Morarji Cricket League", subtitle: "Celebrating the spirit of cricket, competition, teamwork and the memories we create together.",
    history: "View MCL history", archiveKicker: "MCL history", archiveTitle: "Every season. Every team. Every memory.", archiveCopy: "Reliving every season, every team, every champion and every unforgettable moment.",
    champion: "Champions", runner: "Runner-up", third: "Third place", teams: "Teams", awards: "Awards", memories: "Memories", players: "Players", tournament: "Tournament information", statistics: "Verified season statistics", viewSeason: "View season", home: "Back to home", datesTbd: "Tournament dates are yet to be decided", noSeasons: "MCL history will appear here once tournament records are added.", noAwards: "No awards have been recorded for this season yet.", noMemories: "No memories have been added for this season yet.", noTeams: "No teams have been recorded for this season yet.", present: "Not recorded", language: "Language",
  },
  kn: {
    kicker: "ವಾರ್ಷಿಕ ಕ್ರಿಕೆಟ್ ಪರಂಪರೆ", title: "ಎಂಸಿಎಲ್ — ಮೊರಾರ್ಜಿ ಕ್ರಿಕೆಟ್ ಲೀಗ್", subtitle: "ಕ್ರಿಕೆಟ್, ಸ್ಪರ್ಧೆ, ತಂಡದ ಮನೋಭಾವ ಮತ್ತು ನಾವು ಒಟ್ಟಾಗಿ ಸೃಷ್ಟಿಸುವ ನೆನಪುಗಳ ಸಂಭ್ರಮ.",
    history: "ಎಂಸಿಎಲ್ ಇತಿಹಾಸ ನೋಡಿ", archiveKicker: "ಎಂಸಿಎಲ್ ಇತಿಹಾಸ", archiveTitle: "ಪ್ರತಿ ಋತು. ಪ್ರತಿ ತಂಡ. ಪ್ರತಿ ನೆನಪು.", archiveCopy: "ಪ್ರತಿ ಋತು, ತಂಡ, ಚಾಂಪಿಯನ್ ಮತ್ತು ಮರೆಯಲಾಗದ ಕ್ಷಣಗಳನ್ನು ಮತ್ತೆ ನೆನಪಿಸಿಕೊಳ್ಳಿ.",
    champion: "ಚಾಂಪಿಯನ್ಸ್", runner: "ರನ್ನರ್-ಅಪ್", third: "ಮೂರನೇ ಸ್ಥಾನ", teams: "ತಂಡಗಳು", awards: "ಪ್ರಶಸ್ತಿಗಳು", memories: "ನೆನಪುಗಳು", players: "ಆಟಗಾರರು", tournament: "ಪಂದ್ಯಾವಳಿ ಮಾಹಿತಿ", statistics: "ದೃಢೀಕೃತ ಋತು ಅಂಕಿಅಂಶಗಳು", viewSeason: "ಋತುವನ್ನು ನೋಡಿ", home: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ", datesTbd: "ಪಂದ್ಯಾವಳಿಯ ದಿನಾಂಕಗಳನ್ನು ಇನ್ನೂ ನಿರ್ಧರಿಸಬೇಕಾಗಿದೆ", noSeasons: "ಪಂದ್ಯಾವಳಿ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಿದ ನಂತರ ಎಂಸಿಎಲ್ ಇತಿಹಾಸ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.", noAwards: "ಈ ಋತುವಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಶಸ್ತಿಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿಲ್ಲ.", noMemories: "ಈ ಋತುವಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ನೆನಪುಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.", noTeams: "ಈ ಋತುವಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ತಂಡಗಳನ್ನು ದಾಖಲಿಸಲಾಗಿಲ್ಲ.", present: "ದಾಖಲಾಗಿಲ್ಲ", language: "ಭಾಷೆ",
  },
} as const;

function localText(locale: PublicLocale, en: string | null, kn: string | null) { return locale === "kn" ? kn || en || "" : en || kn || ""; }
function teamName(locale: PublicLocale, team: { nameEn: string; nameKn: string | null } | null, fallback: string) { return team ? localText(locale, team.nameEn, team.nameKn) : fallback; }
function initials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "MCL"; }

function useMclLocale() {
  const [locale, setLocale] = useState<PublicLocale>("en");
  useEffect(() => { const saved = localStorage.getItem("mdrs-locale"); const frame = requestAnimationFrame(() => { if (saved === "en" || saved === "kn") setLocale(saved); }); return () => cancelAnimationFrame(frame); }, []);
  const change = (next: PublicLocale) => { setLocale(next); localStorage.setItem("mdrs-locale", next); document.documentElement.lang = next; };
  return { locale, change };
}

function MclLanguage({ locale, change }: { locale: PublicLocale; change: (next: PublicLocale) => void }) {
  return <div className="mcl-language" aria-label={copy[locale].language}><button className={locale === "en" ? "active" : ""} onClick={() => change("en")} aria-pressed={locale === "en"}>EN</button><button className={locale === "kn" ? "active" : ""} onClick={() => change("kn")} aria-pressed={locale === "kn"}>ಕನ್ನಡ</button></div>;
}

export function MclHomepageSection({ season, locale }: { season: PublicMclSeason | null; locale: PublicLocale }) {
  const t = copy[locale];
  return <section id="mcl" className="mcl-home"><div className="mcl-home-heading"><div><p>{t.kicker}</p><h2>{t.title}</h2></div><span>{t.subtitle}</span></div>
    {season ? <div className="mcl-home-feature"><div className="mcl-home-image">{season.coverImageUrl ? <Image className="media-cover" src={season.coverImageUrl} alt={localText(locale, season.titleEn, season.titleKn)} fill sizes="(max-width: 800px) 100vw, 55vw" unoptimized={season.coverImageUrl.includes(".supabase.co/")}/> : <div className="mcl-image-fallback"><Trophy/><span>MCL {season.year}</span></div>}<strong>MCL {season.year}</strong></div><div className="mcl-home-copy"><p>{localText(locale, season.titleEn, season.titleKn)}</p><h3>{localText(locale, season.descriptionEn, season.descriptionKn) || t.subtitle}</h3><div className="mcl-podium"><article><Trophy/><span>{t.champion}</span><b>{teamName(locale, season.championTeam, t.present)}</b></article><article><Shield/><span>{t.runner}</span><b>{teamName(locale, season.runnerUpTeam, t.present)}</b></article></div>{season.awards.length > 0 && <div className="mcl-home-awards">{season.awards.slice(0,4).map((award) => <div key={award.id}><span>{localText(locale, award.awardNameEn, award.awardNameKn)}</span><b>{award.player ? localText(locale, award.player.nameEn, award.player.nameKn) : award.team ? localText(locale, award.team.nameEn, award.team.nameKn) : t.present}</b>{award.statistics && <small>{award.statistics}</small>}</div>)}</div>}<Link href="/mcl">{t.history}<ArrowRight/></Link></div></div> : <div className="mcl-public-empty"><Trophy/><p>{t.noSeasons}</p><Link href="/mcl">{t.history}<ArrowRight/></Link></div>}
  </section>;
}

export function MclArchive({ seasons }: { seasons: PublicMclSeason[] }) {
  const { locale, change } = useMclLocale(); const t = copy[locale];
  return <main className={`mcl-page locale-${locale}`}><header className="mcl-public-nav"><Link href="/">MDRS <span>MCL</span></Link><MclLanguage locale={locale} change={change}/></header><section className="mcl-archive-hero"><Link href="/" className="mcl-back"><ArrowLeft/>{t.home}</Link><p>{t.archiveKicker}</p><h1>{t.archiveTitle}</h1><span>{t.archiveCopy}</span></section>
    {seasons.length ? <section className="mcl-history-list">{seasons.map((season, index) => <article key={season.id}><div className="mcl-history-number">{String(index + 1).padStart(2,"0")}</div><div className="mcl-history-image">{season.coverImageUrl ? <Image className="media-cover" src={season.coverImageUrl} alt="" fill sizes="(max-width:700px) 100vw, 38vw" unoptimized={season.coverImageUrl.includes(".supabase.co/")}/> : <Trophy/>}</div><div className="mcl-history-copy"><p>MCL {season.year}</p><h2>{localText(locale, season.titleEn, season.titleKn)}</h2><span>{localText(locale, season.descriptionEn, season.descriptionKn)}</span><dl><div><dt>{t.champion}</dt><dd>{teamName(locale, season.championTeam, t.present)}</dd></div><div><dt>{t.runner}</dt><dd>{teamName(locale, season.runnerUpTeam, t.present)}</dd></div></dl><Link href={`/mcl/${season.year}`}>{t.viewSeason}<ArrowRight/></Link></div></article>)}</section> : <section className="mcl-public-empty archive"><Trophy/><h2>{t.noSeasons}</h2></section>}
  </main>;
}

export function MclSeasonDetail({ season }: { season: PublicMclSeason }) {
  const { locale, change } = useMclLocale(); const t = copy[locale]; const stats = season.verifiedStatistics && typeof season.verifiedStatistics === "object" && !Array.isArray(season.verifiedStatistics) ? Object.entries(season.verifiedStatistics) : [];
  const players = season.teams.flatMap((team) => team.players.map((roster) => ({ ...roster, team })));
  const awardsNumber = players.length ? 3 : 2;
  const statisticsNumber = awardsNumber + (season.awards.length ? 1 : 0);
  const memoriesNumber = statisticsNumber + (stats.length ? 1 : 0);
  return <main className={`mcl-page locale-${locale}`}><header className="mcl-public-nav"><Link href="/mcl">MDRS <span>MCL</span></Link><MclLanguage locale={locale} change={change}/></header><section className="mcl-season-hero">{season.coverImageUrl && <Image className="media-cover" src={season.coverImageUrl} alt="" fill priority sizes="100vw" unoptimized={season.coverImageUrl.includes(".supabase.co/")}/>}<div className="mcl-season-shade"/><div><Link href="/mcl" className="mcl-back"><ArrowLeft/>{t.history}</Link><p>MCL {season.year}</p><h1>{localText(locale, season.titleEn, season.titleKn)}</h1><span>{localText(locale, season.descriptionEn, season.descriptionKn)}</span></div></section>
    <section className="mcl-season-body"><div className="mcl-info"><p>{t.tournament}</p><div>{season.datesToBeDecided ? <span><CalendarDays/>{t.datesTbd}</span> : season.startDate && <span><CalendarDays/>{new Date(season.startDate).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { dateStyle:"long" })}{season.endDate ? ` — ${new Date(season.endDate).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { dateStyle:"long" })}` : ""}</span>}{localText(locale, season.venueEn, season.venueKn) && <span><MapPin/>{localText(locale, season.venueEn, season.venueKn)}</span>}<span><Users/>{season.teams.length} {t.teams}</span></div><p>{localText(locale, season.detailedEn, season.detailedKn)}</p></div>
      <div className="mcl-season-podium"><article className="champion"><Trophy/><span>{t.champion}</span>{season.championTeam?.logoUrl && <Image src={season.championTeam.logoUrl} alt="" width={84} height={84} unoptimized={season.championTeam.logoUrl.includes(".supabase.co/")}/>}<h2>{teamName(locale, season.championTeam, t.present)}</h2></article><article><Shield/><span>{t.runner}</span><h3>{teamName(locale, season.runnerUpTeam, t.present)}</h3></article>{season.thirdPlaceTeam && <article><span>{t.third}</span><h3>{teamName(locale, season.thirdPlaceTeam, t.present)}</h3></article>}</div>
      <section className="mcl-detail-section"><header><p>01</p><h2>{t.teams}</h2></header>{season.teams.length ? <div className="mcl-team-grid">{season.teams.map((team) => <article key={team.id}>{team.logoUrl ? <Image src={team.logoUrl} alt="" width={64} height={64} unoptimized={team.logoUrl.includes(".supabase.co/")}/> : <span className="mcl-team-initials" aria-hidden="true">{initials(team.nameEn)}</span>}<h3>{localText(locale, team.nameEn, team.nameKn)}</h3>{team.captain && <p>{locale === "kn" ? "ನಾಯಕ" : "Captain"}: {team.captain}</p>}<span>{team.players.length} {t.players}</span>{[team.finalPosition,team.matchesPlayed,team.wins,team.losses,team.points].some((value) => value !== null) && <dl><div><dt>{locale === "kn" ? "ಸ್ಥಾನ" : "Position"}</dt><dd>{team.finalPosition ?? "—"}</dd></div><div><dt>{locale === "kn" ? "ಪಂದ್ಯಗಳು" : "Matches"}</dt><dd>{team.matchesPlayed ?? "—"}</dd></div><div><dt>{locale === "kn" ? "ಗೆಲುವು" : "Wins"}</dt><dd>{team.wins ?? "—"}</dd></div><div><dt>{locale === "kn" ? "ಅಂಕಗಳು" : "Points"}</dt><dd>{team.points ?? "—"}</dd></div></dl>}</article>)}</div> : <p className="mcl-inline-empty">{t.noTeams}</p>}</section>
      {players.length > 0 && <section className="mcl-detail-section"><header><p>02</p><h2>{t.players}</h2></header><div className="mcl-player-grid">{players.map(({ id, player, role, jerseyNumber, team }) => <article key={id}><span>{jerseyNumber !== null ? `#${jerseyNumber}` : initials(player.nameEn)}</span><div><h3>{localText(locale, player.nameEn, player.nameKn)}</h3><p>{role || (locale === "kn" ? "ಪಾತ್ರ ದಾಖಲಾಗಿಲ್ಲ" : "Role not recorded")}</p><small>{localText(locale, team.nameEn, team.nameKn)}</small></div></article>)}</div></section>}
      {season.awards.length > 0 && <section className="mcl-detail-section"><header><p>{String(awardsNumber).padStart(2,"0")}</p><h2>{t.awards}</h2></header><div className="mcl-award-grid">{season.awards.map((award) => <article key={award.id}>{award.imageUrl && <div><Image className="media-cover" src={award.imageUrl} alt="" fill sizes="240px" unoptimized={award.imageUrl.includes(".supabase.co/")}/></div>}<p>{localText(locale, award.awardNameEn, award.awardNameKn)}</p><h3>{award.player ? localText(locale, award.player.nameEn, award.player.nameKn) : award.team ? localText(locale, award.team.nameEn, award.team.nameKn) : t.present}</h3>{award.statistics && <strong>{award.statistics}</strong>}<span>{localText(locale, award.descriptionEn, award.descriptionKn)}</span></article>)}</div></section>}
      {stats.length > 0 && <section className="mcl-detail-section"><header><p>{String(statisticsNumber).padStart(2,"0")}</p><h2>{t.statistics}</h2></header><div className="mcl-stat-grid">{stats.filter(([,value]) => ["string","number"].includes(typeof value)).map(([label,value]) => <article key={label}><span>{label.replaceAll("_"," ")}</span><b>{String(value)}</b></article>)}</div></section>}
      <section className="mcl-detail-section"><header><p>{String(memoriesNumber).padStart(2,"0")}</p><h2>{t.memories}</h2></header>{season.memories.length ? <div className="mcl-memory-grid">{season.memories.map((memory) => <figure key={memory.id}><div><Image className="media-cover" src={memory.imageUrl} alt={memory.altText} fill sizes="(max-width:650px) 100vw, 33vw" unoptimized={memory.imageUrl.includes(".supabase.co/")}/></div><figcaption><span>{memory.category.replaceAll("_"," ")}</span>{localText(locale, memory.captionEn, memory.captionKn)}</figcaption></figure>)}</div> : <p className="mcl-inline-empty">{t.noMemories}</p>}</section>
    </section></main>;
}
