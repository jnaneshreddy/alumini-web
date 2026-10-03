"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, MapPin, Menu, Pause, Play, X } from "lucide-react";
import { FeedbackForm } from "@/components/feedback-form";
import { publicMessages, type PublicLocale } from "@/lib/public-i18n";

export type PublicSlide = { id: string; title: string; caption: string | null; imagePath: string; altText: string };
export type PublicNotice = { id: string; title: string; titleKn: string | null; body: string; bodyKn: string | null; priority: string; publishedAt: string | null };
export type PublicEvent = { id: string; title: string; titleKn: string | null; description: string | null; descriptionKn: string | null; eventDate: string; venue: string | null; venueKn: string | null; imagePath: string | null };

type Props = {
  slides: PublicSlide[];
  notices: PublicNotice[];
  events: PublicEvent[];
  unavailable: boolean;
};

const navTargets = ["home", "story", "highlights", "events", "announcements", "feedback"] as const;

function useLocale() {
  const [locale, setLocale] = useState<PublicLocale>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("mdrs-locale");
    const frame = window.requestAnimationFrame(() => {
      if (saved === "en" || saved === "kn") setLocale(saved);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const changeLocale = (next: PublicLocale) => {
    setLocale(next);
    window.localStorage.setItem("mdrs-locale", next);
    document.documentElement.lang = next;
  };
  return { locale, changeLocale, t: publicMessages[locale] };
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return <motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .18 }} transition={{ duration: reduceMotion ? 0 : .58, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Header({ locale, setLocale }: { locale: PublicLocale; setLocale: (locale: PublicLocale) => void }) {
  const t = publicMessages[locale];
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const label: Record<(typeof navTargets)[number], string> = { home: t.home, story: t.story, highlights: t.highlights, events: t.events, announcements: t.announcements, feedback: t.feedback };
  const close = () => setOpen(false);
  return <>
    <a className="heritage-skip" href="#main-content">{t.skip}</a>
    <header className={`heritage-header ${compact ? "is-compact" : ""}`}>
      <a className="heritage-brand" href="#home" aria-label={`${t.school} ${t.home}`}><span aria-hidden="true">M</span><span><strong>{t.school}</strong><small>{t.alumni}</small></span></a>
      <nav className="heritage-desktop-nav" aria-label="Primary navigation">{navTargets.map((target) => <a key={target} href={`#${target}`}>{label[target]}</a>)}</nav>
      <div className="heritage-header-actions"><LanguageSwitch locale={locale} setLocale={setLocale}/><button className="heritage-menu-button" type="button" onClick={() => setOpen(true)} aria-label={t.openMenu} aria-expanded={open}><Menu size={21}/></button></div>
    </header>
    <AnimatePresence>{open && <motion.div className="heritage-drawer" role="dialog" aria-modal="true" aria-label={t.openMenu} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: .35, ease: [0.22, 1, 0.36, 1] }}><div className="drawer-top"><span>{t.alumni}</span><button type="button" onClick={close} aria-label={t.closeMenu}><X/></button></div><nav>{navTargets.map((target, index) => <a key={target} href={`#${target}`} onClick={close}><span>{String(index + 1).padStart(2, "0")}</span>{label[target]}</a>)}</nav><div className="drawer-language"><span>{t.language}</span><LanguageSwitch locale={locale} setLocale={setLocale}/></div></motion.div></motion.div>}</AnimatePresence>
  </>;
}

function LanguageSwitch({ locale, setLocale }: { locale: PublicLocale; setLocale: (locale: PublicLocale) => void }) {
  return <div className="heritage-language" aria-label={publicMessages[locale].language}><button type="button" className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")} aria-pressed={locale === "en"}>EN</button><span aria-hidden="true">/</span><button type="button" className={locale === "kn" ? "active" : ""} onClick={() => setLocale("kn")} aria-pressed={locale === "kn"}>ಕನ್ನಡ</button></div>;
}

function Hero({ slides, locale }: { slides: PublicSlide[]; locale: PublicLocale }) {
  const t = publicMessages[locale];
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const current = slides[index];
  useEffect(() => {
    if (!playing || hovered || reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [hovered, playing, reduceMotion, slides.length]);
  const move = (direction: number) => setIndex((value) => (value + direction + slides.length) % slides.length);
  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStart.current === null || slides.length < 2) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 48) move(delta > 0 ? -1 : 1);
    touchStart.current = null;
  };
  return <section id="home" className="heritage-hero" aria-roledescription="carousel" aria-label="School photographs" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
    <div className="hero-media" aria-live="off">
      <AnimatePresence mode="wait">
        <motion.div className="hero-frame" key={current?.id ?? "empty"} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .8 }}>
          {current && !failed[current.id] ? <Image src={current.imagePath} alt={current.altText} fill priority={index === 0} sizes="100vw" onError={() => setFailed((value) => ({ ...value, [current.id]: true }))}/> : <div className="hero-archive-placeholder"><span>MDRS</span><p>{t.imageUnavailable}</p></div>}
        </motion.div>
      </AnimatePresence>
    </div>
    <div className="hero-shade"/>
    <motion.div className="hero-content" key={locale} initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}><p className="heritage-eyebrow light">{t.established} · {t.location}</p><h1>{t.heroTitle}</h1><p>{t.heroCopy}</p><div><a className="heritage-button warm" href="#story">{t.exploreStory}<ArrowDown size={17}/></a><a className="heritage-button ghost" href="#events">{t.viewEvents}<ArrowRight size={17}/></a></div></motion.div>
    {slides.length > 1 && <div className="hero-controls"><button type="button" onClick={() => move(-1)} aria-label={t.previousSlide}><ChevronLeft/></button><div className="hero-dots">{slides.map((slide, slideIndex) => <button type="button" key={slide.id} className={slideIndex === index ? "active" : ""} onClick={() => setIndex(slideIndex)} aria-label={`${t.slideLabel} ${slideIndex + 1}`} aria-current={slideIndex === index ? "true" : undefined}/>)}</div><button type="button" onClick={() => move(1)} aria-label={t.nextSlide}><ChevronRight/></button><button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? t.pauseSlides : t.playSlides}>{playing ? <Pause size={16}/> : <Play size={16}/>}</button></div>}
    <div className="hero-index" aria-hidden="true"><span>{String(index + 1).padStart(2, "0")}</span><i/><span>{String(Math.max(slides.length, 1)).padStart(2, "0")}</span></div>
  </section>;
}

function Story({ locale }: { locale: PublicLocale }) {
  const t = publicMessages[locale];
  const chapters = [[t.beginning, t.beginningCopy], [t.residential, t.residentialCopy], [t.beyond, t.beyondCopy], [t.values, t.valuesCopy]];
  return <section id="story" className="heritage-story">
    <Reveal className="story-introduction">
      <div className="story-title"><p className="heritage-eyebrow">{t.storyKicker}</p><h2>{t.storyTitle}</h2></div>
      <div className="story-summary"><p className="story-record-label">{t.verifiedRecord}</p><p>{t.storyIntro}</p></div>
    </Reveal>
    <Reveal className="story-statistics"><dl><div><dt>1997</dt><dd>{t.statEstablished}</dd></div><div><dt>1997–98</dt><dd>{t.statOperations}</dd></div><div><dt>{t.acres}</dt><dd>{t.statCampus}</dd></div><div><dt>{t.students}</dt><dd>{t.statStrength}</dd></div></dl></Reveal>
    <div className="story-content">{chapters.map(([title, copy], index) => <Reveal key={title} className="story-chapter"><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{copy}</p></div></Reveal>)}</div>
  </section>;
}

function Highlights({ locale }: { locale: PublicLocale }) {
  const t = publicMessages[locale];
  const items = [[t.academic, t.academicCopy], [t.sport, t.sportCopy], [t.community, t.communityCopy], [t.development, t.developmentCopy]];
  return <section id="highlights" className="heritage-highlights"><Reveal><p className="heritage-eyebrow light">{t.highlightsKicker}</p><h2>{t.highlightsTitle}</h2></Reveal><div>{items.map(([title, copy], index) => <Reveal className="highlight-item" key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}</div></section>;
}

function Events({ events, locale }: { events: PublicEvent[]; locale: PublicLocale }) {
  const t = publicMessages[locale];
  const now = useMemo(() => new Date(), []);
  const ordered = useMemo(() => [...events].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()), [events]);
  return <section id="events" className="heritage-events"><Reveal className="section-intro"><p className="heritage-eyebrow">{t.eventsKicker}</p><h2>{t.eventsTitle}</h2></Reveal>{ordered.length ? <ol className="event-timeline">{ordered.map((event, index) => { const date = new Date(event.eventDate); const upcoming = date >= now; const title = locale === "kn" && event.titleKn ? event.titleKn : event.title; const description = locale === "kn" && event.descriptionKn ? event.descriptionKn : event.description; const venue = locale === "kn" && event.venueKn ? event.venueKn : event.venue; return <motion.li key={event.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: Math.min(index * .08, .3) }}><div className="event-node"><span/></div><article><div className="event-date"><b>{date.toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { day: "2-digit" })}</b><span>{date.toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { month: "short", year: "numeric" })}</span></div><div className="event-copy"><p className={upcoming ? "upcoming" : "past"}>{upcoming ? t.upcoming : t.past}</p><h3>{title}</h3>{description && <p>{description}</p>}<small><MapPin size={15}/>{venue || t.locationPending}</small></div>{event.imagePath && <div className="event-image"><Image src={event.imagePath} alt="" fill sizes="(max-width: 720px) 100vw, 34vw"/></div>}</article></motion.li>; })}</ol> : <div className="heritage-empty"><span>—</span><h3>{t.noEvents}</h3><p>{t.noEventsCopy}</p></div>}</section>;
}

function Announcements({ notices, locale }: { notices: PublicNotice[]; locale: PublicLocale }) {
  const t = publicMessages[locale];
  return <section id="announcements" className="heritage-notices"><Reveal className="section-intro"><p className="heritage-eyebrow">{t.noticesKicker}</p><h2>{t.noticesTitle}</h2></Reveal>{notices.length ? <div className="notice-ledger">{notices.map((notice) => { const title = locale === "kn" && notice.titleKn ? notice.titleKn : notice.title; const body = locale === "kn" && notice.bodyKn ? notice.bodyKn : notice.body; return <Reveal className="notice-row" key={notice.id}><time>{notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</time><div><span>{notice.priority}</span><h3>{title}</h3><p>{body}</p></div><Link href="/notices" aria-label={`${t.readMore}: ${title}`}><ArrowRight/></Link></Reveal>; })}</div> : <div className="heritage-empty"><span>—</span><h3>{t.noNotices}</h3><p>{t.noNoticesCopy}</p></div>}</section>;
}

function Footer({ locale, setLocale }: { locale: PublicLocale; setLocale: (locale: PublicLocale) => void }) {
  const t = publicMessages[locale];
  return <footer className="heritage-footer"><div><p className="heritage-eyebrow light">{t.established}</p><h2>{t.school}</h2><p>{t.footerLine}</p></div><address>{t.address}</address><nav aria-label="Footer navigation"><a href="#story">{t.story}</a><a href="#events">{t.events}</a><a href="#announcements">{t.announcements}</a><a href="#feedback">{t.feedback}</a><Link href="/admin/login">{t.admin}</Link></nav><div className="footer-base"><span>© {new Date().getFullYear()} {t.rights}</span><LanguageSwitch locale={locale} setLocale={setLocale}/></div></footer>;
}

export function PublicHome({ slides, notices, events, unavailable }: Props) {
  const { locale, changeLocale, t } = useLocale();
  return <main id="main-content" className={`heritage-site locale-${locale}`}><Header locale={locale} setLocale={changeLocale}/>{unavailable && <div className="heritage-service-note" role="status">{locale === "kn" ? "ನೇರ ಪ್ರಕಟಣೆಗಳು ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ." : "Live updates are temporarily unavailable."}</div>}<Hero slides={slides} locale={locale}/><Story locale={locale}/><Highlights locale={locale}/><Events events={events} locale={locale}/><Announcements notices={notices} locale={locale}/><FeedbackForm locale={locale} messages={t}/><Footer locale={locale} setLocale={changeLocale}/></main>;
}
