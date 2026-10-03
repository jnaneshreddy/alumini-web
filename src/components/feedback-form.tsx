"use client";

import { FormEvent, useActionState, useId, useState } from "react";
import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { submitFeedback, type FeedbackState } from "@/app/feedback-actions";
import { publicMessages, type PublicLocale, type PublicMessages } from "@/lib/public-i18n";

type Values = { fullName: string; email: string; batch: string; alumniType: string; message: string };
const initialState: FeedbackState = {};

export function FeedbackForm({ locale = "en", messages: t = publicMessages.en }: { locale?: PublicLocale; messages?: PublicMessages }) {
  const [state, action, pending] = useActionState(submitFeedback, initialState);
  const [values, setValues] = useState<Values>({ fullName: "", email: "", batch: "", alumniType: "", message: "" });
  const [touched, setTouched] = useState<Partial<Record<keyof Values, boolean>>>({});
  const [dismissedReference, setDismissedReference] = useState<string | null>(null);
  const messageId = useId();
  const update = (field: keyof Values, value: string) => setValues((current) => ({ ...current, [field]: value }));
  const errors: Partial<Record<keyof Values, string>> = {
    ...(!values.fullName.trim() ? { fullName: t.nameError } : {}),
    ...(!/^\S+@\S+\.\S+$/.test(values.email) ? { email: t.emailError } : {}),
    ...(!values.alumniType ? { alumniType: t.identityError } : {}),
    ...(values.message.trim().length < 10 ? { message: t.messageError } : {}),
  };
  const valid = !errors.fullName && !errors.email && !errors.alumniType && !errors.message;
  const submitted = Boolean(state.referenceId && state.referenceId !== dismissedReference);
  const identities = [["Student", t.student], ["Teacher", t.teacher], ["Staff", t.staff], ["Other", t.other]];
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    setTouched({ fullName: true, email: true, alumniType: true, message: true });
    if (!valid) event.preventDefault();
  }
  function reset() {
    setDismissedReference(state.referenceId ?? null);
    setValues({ fullName: "", email: "", batch: "", alumniType: "", message: "" });
    setTouched({});
  }
  if (submitted && state.referenceId) return <section id="feedback" className="heritage-feedback"><div className="feedback-success" role="status"><span><Check/></span><p className="heritage-eyebrow">{t.feedbackKicker}</p><h2>{t.feedbackSuccess}</h2><p>{t.feedbackSuccessCopy}</p><code>{state.referenceId}</code><button type="button" onClick={reset}>{t.anotherResponse}<ArrowRight size={16}/></button></div></section>;
  return <section id="feedback" className="heritage-feedback" lang={locale}><div className="feedback-intro"><p className="heritage-eyebrow">{t.feedbackKicker}</p><h2>{t.feedbackTitle}</h2><p>{t.feedbackCopy}</p></div><form action={action} onSubmit={onSubmit} noValidate>
    <input type="hidden" name="feedbackType" value="Suggestion"/>
    <Field label={t.name} error={touched.fullName ? errors.fullName : undefined}><input aria-label={t.name} name="fullName" value={values.fullName} onChange={(event) => update("fullName", event.target.value)} onBlur={() => setTouched((value) => ({ ...value, fullName: true }))} autoComplete="name" aria-invalid={Boolean(touched.fullName && errors.fullName)}/></Field>
    <Field label={t.email} error={touched.email ? errors.email : undefined}><input aria-label={t.email} name="email" type="email" value={values.email} onChange={(event) => update("email", event.target.value)} onBlur={() => setTouched((value) => ({ ...value, email: true }))} autoComplete="email" aria-invalid={Boolean(touched.email && errors.email)}/></Field>
    <fieldset className="feedback-identity"><legend>{t.identity}</legend><div>{identities.map(([value, label]) => <label key={value} className={values.alumniType === value ? "selected" : ""}><input type="radio" name="alumniType" value={value} checked={values.alumniType === value} onChange={(event) => { update("alumniType", event.target.value); setTouched((current) => ({ ...current, alumniType: true })); }}/><span>{label}</span></label>)}</div>{touched.alumniType && errors.alumniType && <small role="alert">{errors.alumniType}</small>}</fieldset>
    <Field label={`${t.batch} · ${t.batchOptional}`}><input aria-label={`${t.batch} · ${t.batchOptional}`} name="batch" value={values.batch} onChange={(event) => update("batch", event.target.value)} inputMode="numeric"/></Field>
    <div className="feedback-message"><label htmlFor={messageId}>{t.message}</label><textarea id={messageId} name="message" value={values.message} onChange={(event) => update("message", event.target.value)} onBlur={() => setTouched((value) => ({ ...value, message: true }))} aria-invalid={Boolean(touched.message && errors.message)}/>{touched.message && errors.message && <small role="alert">{errors.message}</small>}</div>
    {state.error && <p className="feedback-error" role="alert">{state.error}</p>}
    <button className="feedback-submit" type="submit" disabled={!valid || pending}>{pending ? <LoaderCircle className="spinner" size={18}/> : null}<span>{pending ? t.submitting : t.submit}</span><ArrowRight size={18}/></button>
  </form></section>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="feedback-field"><label>{label}</label>{children}{error && <small role="alert">{error}</small>}</div>;
}
