import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { AlumniRegistrationForm } from "@/components/alumni-registration-form";

export const metadata = { title: "Join the school directory" };

export default function JoinPage() {
  return <main className="join-page"><header className="join-header"><Link href="/" className="join-brand"><span><Image src="/school-logo-transparent.png" alt="" width={48} height={48} unoptimized/></span><span><b>Morarji Desai</b><small>Residential School Alumni</small></span></Link><Link href="/" className="join-back"><ArrowLeft size={16}/>Back to home</Link></header><section className="join-layout"><div className="join-intro"><p className="heritage-eyebrow">MDRS SCHOOL DIRECTORY</p><h1>Stay connected to your school community.</h1><p>Students, teachers, and alumni can submit their details here. Every registration is reviewed before it is added to the community record.</p><div><ShieldCheck size={18}/><span>Your contact details stay private until the administration reviews your request.</span></div></div><div className="join-card"><p className="heritage-eyebrow">REGISTRATION</p><h2>Join the directory</h2><p>All fields are required.</p><AlumniRegistrationForm/></div></section></main>;
}
