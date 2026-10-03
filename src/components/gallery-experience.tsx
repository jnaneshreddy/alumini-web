"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Eye, ImageIcon, X } from "lucide-react";
import { galleryCategories, galleryCategoryLabels, type PublicGalleryImage } from "@/lib/gallery";
import type { PublicLocale } from "@/lib/public-i18n";

const copy = {
  en: {
    kicker: "Photo gallery", title: "Memories That Stay", intro: "A glimpse into the moments, people and memories that have shaped our school community.",
    more: "View More Memories", empty: "No memories available yet.", archiveTitle: "Memories & Photo Gallery", archiveIntro: "Explore moments from school life, events, campus memories and alumni gatherings.",
    all: "All", previous: "Previous", next: "Next", close: "Close photo viewer", download: "Download", collectionEmpty: "No memories have been added to this collection yet.", home: "Back to home",
  },
  kn: {
    kicker: "ಛಾಯಾಚಿತ್ರ ಸಂಗ್ರಹ", title: "ಉಳಿಯುವ ನೆನಪುಗಳು", intro: "ನಮ್ಮ ಶಾಲಾ ಸಮುದಾಯವನ್ನು ರೂಪಿಸಿದ ಕ್ಷಣಗಳು, ವ್ಯಕ್ತಿಗಳು ಮತ್ತು ನೆನಪುಗಳ ಒಂದು ನೋಟ.",
    more: "ಇನ್ನಷ್ಟು ನೆನಪುಗಳನ್ನು ವೀಕ್ಷಿಸಿ", empty: "ಇನ್ನೂ ಯಾವುದೇ ನೆನಪುಗಳು ಲಭ್ಯವಿಲ್ಲ.", archiveTitle: "ನೆನಪುಗಳು ಮತ್ತು ಛಾಯಾಚಿತ್ರ ಸಂಗ್ರಹ", archiveIntro: "ಶಾಲಾ ಜೀವನ, ಕಾರ್ಯಕ್ರಮಗಳು, ಆವರಣದ ನೆನಪುಗಳು ಮತ್ತು ಹಳೆಯ ವಿದ್ಯಾರ್ಥಿಗಳ ಸಮಾವೇಶಗಳ ಕ್ಷಣಗಳನ್ನು ಅನ್ವೇಷಿಸಿ.",
    all: "ಎಲ್ಲಾ", previous: "ಹಿಂದಿನದು", next: "ಮುಂದಿನದು", close: "ಛಾಯಾಚಿತ್ರ ವೀಕ್ಷಕವನ್ನು ಮುಚ್ಚಿ", download: "ಡೌನ್‌ಲೋಡ್", collectionEmpty: "ಈ ಸಂಗ್ರಹಕ್ಕೆ ಇನ್ನೂ ಯಾವುದೇ ನೆನಪುಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.", home: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
  },
};

function displayText(image: PublicGalleryImage, locale: PublicLocale) {
  return {
    title: locale === "kn" ? image.titleKn || image.titleEn : image.titleEn || image.titleKn,
    description: locale === "kn" ? image.descriptionKn || image.descriptionEn : image.descriptionEn || image.descriptionKn,
  };
}

function GalleryImage({ image, index, locale, onOpen, priority = false }: { image: PublicGalleryImage; index: number; locale: PublicLocale; onOpen: () => void; priority?: boolean }) {
  const item = displayText(image, locale);
  const src = image.thumbnailUrl || image.imageUrl;
  return <motion.button className={`archive-image archive-image-${index % 6}`} type="button" onClick={onOpen} whileHover={{ y: -3 }} aria-label={`${item.title || copy[locale].title}. ${galleryCategoryLabels[image.category][locale]}`}>
    <Image src={src} alt={image.altText} fill priority={priority} sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw" unoptimized={src.includes(".supabase.co/")}/>
    <span className="archive-image-shade"/>
    <span className="archive-image-meta"><small>{galleryCategoryLabels[image.category][locale]}</small>{item.title && <b>{item.title}</b>}</span>
    <span className="archive-view-icon" aria-hidden="true"><Eye size={17}/></span>
  </motion.button>;
}

function Lightbox({ images, index, locale, onChange, onClose }: { images: PublicGalleryImage[]; index: number; locale: PublicLocale; onChange: (next: number) => void; onClose: () => void }) {
  const image = images[index];
  const item = displayText(image, locale);
  const dialog = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<number | null>(null);
  const reduceMotion = useReducedMotion();
  const move = useCallback((amount: number) => onChange((index + amount + images.length) % images.length), [images.length, index, onChange]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) move(-1);
      if (event.key === "ArrowRight" && images.length > 1) move(1);
      if (event.key === "Tab" && dialog.current) {
        const focusable = [...dialog.current.querySelectorAll<HTMLElement>("button, a[href]")].filter((node) => !node.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [images.length, move, onClose]);
  return <motion.div className="archive-lightbox" role="dialog" aria-modal="true" aria-label={item.title || copy[locale].archiveTitle} ref={dialog} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="lightbox-toolbar"><span>{String(index + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span><div><a href={`/api/gallery/${image.id}/download`} aria-label={`${copy[locale].download}: ${item.title || image.altText}`}><Download size={18}/><span>{copy[locale].download}</span></a><button ref={closeButton} type="button" onClick={onClose} aria-label={copy[locale].close}><X/></button></div></div>
    <div className="lightbox-stage" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => { if (touchStart.current === null || images.length < 2) return; const delta = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(delta) > 45) move(delta > 0 ? -1 : 1); touchStart.current = null; }}>
      <AnimatePresence mode="wait"><motion.div className="lightbox-image" key={image.id} initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}><Image src={image.imageUrl} alt={image.altText} fill sizes="100vw" unoptimized={image.imageUrl.includes(".supabase.co/")}/></motion.div></AnimatePresence>
      {images.length > 1 && <><button className="lightbox-previous" type="button" onClick={() => move(-1)} aria-label={copy[locale].previous}><ChevronLeft/></button><button className="lightbox-next" type="button" onClick={() => move(1)} aria-label={copy[locale].next}><ChevronRight/></button></>}
    </div>
    <div className="lightbox-caption"><div><small>{galleryCategoryLabels[image.category][locale]}{image.date ? ` · ${new Date(image.date).toLocaleDateString(locale === "kn" ? "kn-IN" : "en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}</small><h2>{item.title || image.altText}</h2>{item.description && <p>{item.description}</p>}</div>{images.length > 1 && <div className="lightbox-text-nav"><button type="button" onClick={() => move(-1)}><ArrowLeft size={15}/>{copy[locale].previous}</button><button type="button" onClick={() => move(1)}>{copy[locale].next}<ArrowRight size={15}/></button></div>}</div>
  </motion.div>;
}

export function HomepageGallery({ images, locale }: { images: PublicGalleryImage[]; locale: PublicLocale }) {
  const [open, setOpen] = useState<number | null>(null);
  const t = copy[locale];
  return <section id="gallery" className="heritage-gallery"><div className="gallery-heading"><div><p className="heritage-eyebrow">{t.kicker}</p><h2>{t.title}</h2></div><p>{t.intro}</p></div>
    {images.length ? <div className={`homepage-gallery-grid count-${images.length}`}>{images.map((image, index) => <GalleryImage key={image.id} image={image} index={index} locale={locale} onOpen={() => setOpen(index)} priority={index === 0}/>)}</div> : <div className="gallery-empty"><ImageIcon/><h3>{t.empty}</h3><p>{locale === "kn" ? "ದೃಢೀಕರಿಸಿದ ಛಾಯಾಚಿತ್ರಗಳನ್ನು ಪ್ರಕಟಿಸಿದಾಗ ಅವು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ." : "Verified photographs will appear here after they are documented and published."}</p></div>}
    <Link className="gallery-more" href="/gallery">{t.more}<ArrowRight size={17}/></Link>
    <AnimatePresence>{open !== null && <Lightbox images={images} index={open} locale={locale} onChange={setOpen} onClose={() => setOpen(null)}/>}</AnimatePresence>
  </section>;
}

export function GalleryArchive({ images, locale, onLocaleChange, selectedCategory, currentPage, totalPages, galleryType = "all" }: { images: PublicGalleryImage[]; locale: PublicLocale; onLocaleChange: (locale: PublicLocale) => void; selectedCategory: string; currentPage: number; totalPages: number; galleryType?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const t = copy[locale];
  const query = (category: string, page = 1) => `/gallery?category=${category}&page=${page}${galleryType !== "all" ? `&type=${galleryType}` : ""}`;
  return <main className={`gallery-page locale-${locale}`}><header className="gallery-page-nav"><Link href="/">MDRS <span>Alumni Archive</span></Link><div><button className={locale === "en" ? "active" : ""} onClick={() => onLocaleChange("en")} aria-pressed={locale === "en"}>EN</button><button className={locale === "kn" ? "active" : ""} onClick={() => onLocaleChange("kn")} aria-pressed={locale === "kn"}>ಕನ್ನಡ</button></div></header>
    <section className="gallery-page-hero"><Link href="/" className="gallery-back"><ArrowLeft size={15}/>{t.home}</Link><p>{t.kicker}</p><h1>{t.archiveTitle}</h1><span>{t.archiveIntro}</span></section>
    <nav className="gallery-filters" aria-label="Gallery categories"><Link className={selectedCategory === "ALL" ? "active" : ""} href={query("ALL")}>{t.all}</Link>{galleryCategories.map((category) => <Link key={category} className={selectedCategory === category ? "active" : ""} href={query(category)}>{galleryCategoryLabels[category][locale]}</Link>)}</nav>
    <section className="gallery-archive-grid" aria-live="polite">{images.length ? images.map((image, index) => <GalleryImage key={image.id} image={image} index={index} locale={locale} onOpen={() => setOpen(index)} priority={index < 4}/>) : <div className="gallery-empty archive"><ImageIcon/><h2>{selectedCategory === "ALL" ? t.empty : t.collectionEmpty}</h2></div>}</section>
    {totalPages > 1 && <nav className="gallery-pagination" aria-label="Gallery pages">{currentPage > 1 ? <Link href={query(selectedCategory, currentPage - 1)}><ChevronLeft/>{t.previous}</Link> : <span/>}<b>{currentPage} / {totalPages}</b>{currentPage < totalPages ? <Link href={query(selectedCategory, currentPage + 1)}>{t.next}<ChevronRight/></Link> : <span/>}</nav>}
    <AnimatePresence>{open !== null && <Lightbox images={images} index={open} locale={locale} onChange={setOpen} onClose={() => setOpen(null)}/>}</AnimatePresence>
  </main>;
}

export function GalleryArchiveClient(props: Omit<React.ComponentProps<typeof GalleryArchive>, "locale" | "onLocaleChange">) {
  const [locale, setLocale] = useState<PublicLocale>("en");
  useEffect(() => { const saved = localStorage.getItem("mdrs-locale"); const frame = window.requestAnimationFrame(() => { if (saved === "kn" || saved === "en") setLocale(saved); }); return () => window.cancelAnimationFrame(frame); }, []);
  const change = (next: PublicLocale) => { setLocale(next); localStorage.setItem("mdrs-locale", next); document.documentElement.lang = next; };
  return <GalleryArchive {...props} locale={locale} onLocaleChange={change}/>;
}
