import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PublicFooter, PublicHeader } from "@/components/public-shell";
import { FeedbackForm } from "@/components/feedback-form";

const sections = {
  "our-story": { eyebrow: "Our story", title: "A residential education shaped by purpose.", intro: "Since 1997, Morarji Desai Residential School has served students from different communities and backgrounds through academic learning, disciplined residential life and holistic development." },
  alumni: { eyebrow: "Alumni directory", title: "Find the people who shared this place.", intro: "The alumni directory will open as verified profiles are approved. Personal information will only appear with the alumnus’ permission." },
  batches: { eyebrow: "Batches", title: "Every year carries its own memories.", intro: "Batch pages will bring together approved alumni, photographs, memories and reunions. Counts will appear only when verified records are available." },
  memories: { eyebrow: "Memory archive", title: "The campus, remembered together.", intro: "A curated archive for school life, classrooms, sport, cultural events, teachers and reunions. Photographs will appear here after they are documented and published." },
  stories: { eyebrow: "Alumni stories", title: "Journeys that began here.", intro: "Long-form alumni stories will share verified career journeys, school memories and present-day achievements without turning people into statistics." },
  feedback: { eyebrow: "Feedback", title: "Help shape the alumni community.", intro: "Share a suggestion, school memory or concern privately with the administration." },
  events: { eyebrow: "Events", title: "Return, reconnect and take part.", intro: "Confirmed reunions, school programmes and alumni gatherings appear here." },
  notices: { eyebrow: "Notice board", title: "Official updates, clearly presented.", intro: "Published institutional, alumni and event announcements appear in chronological order." },
} as const;

type Section = keyof typeof sections;
export function generateStaticParams() { return Object.keys(sections).map((section) => ({ section })); }
export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> { const { section } = await params; const item = sections[section as Section]; return item ? { title: item.eyebrow } : {}; }

export default async function SectionPage({ params }: PageProps<"/[section]">) {
  const { section: slug } = await params;
  if (!(slug in sections)) notFound();
  const section = sections[slug as Section];
  if (slug === "feedback") return <main className="mdrs-site inner-page"><PublicHeader/><section className="page-hero"><p className="eyebrow">{section.eyebrow}</p><h1>{section.title}</h1><p>{section.intro}</p></section><FeedbackForm/><PublicFooter/></main>;

  const records = slug === "events" ? await prisma.event.findMany({ where: { publication: "PUBLISHED" }, orderBy: { eventDate: "desc" } }).catch(() => []) : slug === "notices" ? await prisma.announcement.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } }).catch(() => []) : [];
  return <main className="mdrs-site inner-page"><PublicHeader/><section className="page-hero"><Link href="/" className="back-link"><ArrowLeft size={15}/> Home</Link><p className="eyebrow">{section.eyebrow}</p><h1>{section.title}</h1><p>{section.intro}</p></section>
    {slug === "our-story" ? <section className="story-chapters">{[["Our beginning","Established in 1997, with academic operations beginning in 1997–98."],["Residential education","Learning, living and shared responsibility form one connected experience."],["Learning beyond the classroom","Sport, yoga, physical education and community development support academic life."],["Discipline and self-study","Daily routines encourage independence, focus and character development."]].map(([title,body],i) => <article key={title}><span>0{i+1}</span><div><h2>{title}</h2><p>{body}</p></div></article>)}</section> : null}
    {(slug === "events" || slug === "notices") && <section className="record-archive">{records.length ? records.map((record) => <article key={record.id}><div>{"eventDate" in record ? <CalendarDays/> : <span className="record-dot"/>}</div><div><h2>{record.title}</h2><p>{"description" in record ? record.description || "Details will be announced." : record.body}</p>{"venue" in record && <small><MapPin size={14}/>{record.venue || "Location to be announced"}</small>}</div><time>{new Date(("eventDate" in record ? record.eventDate : record.publishedAt) || record.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</time></article>) : <div className="empty-state"><h3>Nothing published yet</h3><p>Verified {slug} will appear here when available.</p></div>}</section>}
    {!["our-story","events","notices"].includes(slug) && <section className="registry-pending"><span>Archive in preparation</span><h2>Real records, published with care.</h2><p>We are preparing this section around verified institutional and alumni data. No placeholder people, counts or achievements have been added.</p></section>}
    <PublicFooter/></main>;
}
