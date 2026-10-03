"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { submitAlumniRegistration, type JoinState } from "@/app/join/actions";

const initialState: JoinState = {};

export function AlumniRegistrationForm() {
  const [state, formAction, pending] = useActionState(submitAlumniRegistration, initialState);
  if (state.submitted) return <section className="join-success" role="status"><span><Check size={23}/></span><p className="heritage-eyebrow">REGISTRATION RECEIVED</p><h2>Thank you for joining us.</h2><p>Your details have been sent to the MDRS Alumni team for review. We will contact you using the email address you provided.</p><Link href="/">Return to home</Link></section>;
  return <form className="join-form" action={formAction} noValidate>
    <div className="join-field wide"><label htmlFor="join-name">Full name</label><input id="join-name" name="fullName" autoComplete="name" required minLength={2}/></div>
    <div className="join-field wide"><label htmlFor="join-type">I am registering as</label><select id="join-type" name="registrantType" defaultValue="ALUMNI" required><option value="ALUMNI">Alumni</option><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></select></div>
    <div className="join-field"><label htmlFor="join-email">Email address</label><input id="join-email" name="email" type="email" autoComplete="email" required/></div>
    <div className="join-field"><label htmlFor="join-phone">Phone number</label><input id="join-phone" name="phone" type="tel" autoComplete="tel" required/></div>
    <div className="join-field"><label htmlFor="join-batch">Batch</label><input id="join-batch" name="batch" placeholder="Example: 2012-13" required/></div>
    <div className="join-field"><label htmlFor="join-year">Graduation year</label><input id="join-year" name="graduationYear" type="number" inputMode="numeric" min="1900" max={new Date().getFullYear() + 1} required/></div>
    <div className="join-honeypot" aria-hidden="true"><label htmlFor="join-website">Website</label><input id="join-website" name="website" tabIndex={-1} autoComplete="off"/></div>
    {state.error && <p className="join-error" role="alert">{state.error}</p>}
    <button className="join-submit" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spinner" size={18}/> : null}<span>{pending ? "Submitting…" : "Request to join"}</span><ArrowRight size={18}/></button>
  </form>;
}
