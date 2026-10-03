"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { PublicTeacher } from "@/lib/teachers";
import { publicMessages, type PublicLocale } from "@/lib/public-i18n";

function TeacherCard({ teacher, locale }: { teacher: PublicTeacher; locale: PublicLocale }) {
  const t = publicMessages[locale];
  const name = locale === "kn" && teacher.nameKn ? teacher.nameKn : teacher.nameEn;
  const designation = locale === "kn" && teacher.designationKn ? teacher.designationKn : teacher.designationEn;
  const description = locale === "kn" && teacher.descriptionKn ? teacher.descriptionKn : teacher.descriptionEn;
  const period = `${teacher.startYear} – ${teacher.isCurrent ? t.present : teacher.endYear}`;
  return <article className="teacher-card">
    <div className="teacher-portrait">
      <Image className="media-cover media-portrait" src={teacher.imageUrl} alt={`${name}, ${designation}`} fill sizes="(max-width: 600px) 50vw, (max-width: 1050px) 33vw, 25vw" unoptimized={teacher.imageUrl.includes(".supabase.co/")}/>
      <span className={teacher.isCurrent ? "current" : "former"}>{teacher.isCurrent ? t.currentTeacher : t.formerTeacher}</span>
    </div>
    <div className="teacher-card-copy">
      <p>{period}</p>
      <h3>{name}</h3>
      <strong>{designation}</strong>
      {description && <span>{description}</span>}
    </div>
  </article>;
}

export function TeacherShowcase({ teachers, locale, showAllLink }: { teachers: PublicTeacher[]; locale: PublicLocale; showAllLink: boolean }) {
  const t = publicMessages[locale];
  const reduceMotion = useReducedMotion();
  if (!teachers.length) return null;
  return <section id="teachers" className="heritage-teachers">
    <motion.div className="teacher-section-heading" initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }}>
      <div><p className="heritage-eyebrow light">{t.teachersKicker}</p><h2>{t.teachersTitle}</h2></div>
      <p>{t.teachersSubtitle}</p>
    </motion.div>
    <div className="teacher-grid homepage-teachers">{teachers.map((teacher, index) => <motion.div key={teacher.id} initial={reduceMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ delay: Math.min(index * .06, .24) }}><TeacherCard teacher={teacher} locale={locale}/></motion.div>)}</div>
    {showAllLink && <Link className="teachers-more" href="/teachers">{t.viewAllTeachers}<ArrowRight size={17}/></Link>}
  </section>;
}

export function TeachersArchive({ teachers }: { teachers: PublicTeacher[] }) {
  const [locale, setLocale] = useState<PublicLocale>("en");
  useEffect(() => {
    const saved = localStorage.getItem("mdrs-locale");
    const frame = requestAnimationFrame(() => { if (saved === "en" || saved === "kn") setLocale(saved); });
    return () => cancelAnimationFrame(frame);
  }, []);
  const changeLocale = (next: PublicLocale) => { setLocale(next); localStorage.setItem("mdrs-locale", next); document.documentElement.lang = next; };
  const t = publicMessages[locale];
  const current = teachers.filter((teacher) => teacher.isCurrent);
  const former = teachers.filter((teacher) => !teacher.isCurrent);
  return <main className={`teachers-page locale-${locale}`}>
    <nav className="teachers-page-nav" aria-label="Teacher archive navigation"><Link href="/">MDRS <span>{t.alumni}</span></Link><div aria-label={t.language}><button className={locale === "en" ? "active" : ""} type="button" onClick={() => changeLocale("en")} aria-pressed={locale === "en"}>EN</button><button className={locale === "kn" ? "active" : ""} type="button" onClick={() => changeLocale("kn")} aria-pressed={locale === "kn"}>ಕನ್ನಡ</button></div></nav>
    <header className="teachers-page-hero"><Link href="/" className="teachers-back"><ArrowLeft size={16}/>{t.home}</Link><p>{t.teachersKicker}</p><h1>{t.teachersTitle}</h1><span>{t.teachersPageSubtitle}</span></header>
    {teachers.length ? <div className="teacher-archive-sections">
      {current.length > 0 && <section aria-labelledby="current-faculty"><div className="teacher-group-heading"><span>01</span><h2 id="current-faculty">{t.currentFaculty}</h2><small>{current.length.toString().padStart(2, "0")}</small></div><div className="teacher-grid archive-teachers">{current.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} locale={locale}/>)}</div></section>}
      {former.length > 0 && <section aria-labelledby="former-faculty"><div className="teacher-group-heading"><span>{current.length ? "02" : "01"}</span><h2 id="former-faculty">{t.formerFaculty}</h2><small>{former.length.toString().padStart(2, "0")}</small></div><div className="teacher-grid archive-teachers">{former.map((teacher) => <TeacherCard key={teacher.id} teacher={teacher} locale={locale}/>)}</div></section>}
    </div> : <section className="teachers-empty"><span>—</span><h2>{t.noTeachers}</h2><p>{t.noTeachersCopy}</p></section>}
  </main>;
}
