"use client";

import { FormEvent, useState } from "react";
import { BellRing, Building2, CheckCircle2, KeyRound, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { changeOwnPassword, saveSiteSettings } from "@/app/admin/settings/actions";

type SettingsRecord = {
  organizationName: string; portalName: string; supportEmail: string | null; supportPhone: string | null; timezone: string;
  notifyFeedback: boolean; notifyAlumni: boolean; notifyAccess: boolean; updatedAt: string;
};

const defaults: SettingsRecord = { organizationName: "Morarji Desai Residential School", portalName: "MDRS Alumni", supportEmail: null, supportPhone: null, timezone: "Asia/Kolkata", notifyFeedback: true, notifyAlumni: true, notifyAccess: true, updatedAt: "" };

export function SettingsWorkspace({ settings }: { settings: SettingsRecord | null }) {
  const current = settings ?? defaults;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordOk, setPasswordOk] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage("");
    const result = await saveSiteSettings(data);
    setBusy(false); setMessage(result.message); setOk(result.ok);
    if (result.ok) router.refresh();
  };
  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = event.currentTarget; setPasswordBusy(true); setPasswordMessage("");
    const result = await changeOwnPassword(new FormData(form));
    setPasswordBusy(false); setPasswordMessage(result.message); setPasswordOk(result.ok);
    if (result.ok) form.reset();
  };
  return <div className="settingsWorkspace">
    <section className="usersHeader"><div><p className="adminKicker">WORKSPACE CONFIGURATION</p><h1>Settings</h1><span>Manage public identity, support details and which operational changes reach administrator inboxes.</span></div><div className="settingsStatus"><ShieldCheck size={17}/><span><b>Audited changes</b><small>{current.updatedAt ? `Last saved ${new Date(current.updatedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}` : "Using system defaults"}</small></span></div></section>
    {message && <div className={`settingsMessage ${ok ? "success" : "error"}`} role={ok ? "status" : "alert"}>{ok && <CheckCircle2 size={16}/>} {message}</div>}
    <form className="settingsGrid" onSubmit={submit}>
      <section className="settingsPanel"><header><Building2/><div><p className="adminKicker">IDENTITY</p><h2>Institution details</h2></div></header><div className="settingsFields"><label><span>Organization name</span><input name="organizationName" defaultValue={current.organizationName} required minLength={3}/></label><label><span>Portal name</span><input name="portalName" defaultValue={current.portalName} required minLength={2}/><small>Shown in the administration navigation after refresh.</small></label><div><label><span>Support email <em>optional</em></span><input name="supportEmail" type="email" defaultValue={current.supportEmail ?? ""}/></label><label><span>Support phone <em>optional</em></span><input name="supportPhone" type="tel" defaultValue={current.supportPhone ?? ""}/></label></div><label><span>Workspace timezone</span><select name="timezone" defaultValue={current.timezone}><option value="Asia/Kolkata">Asia/Kolkata</option><option value="UTC">UTC</option><option value="Asia/Dubai">Asia/Dubai</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></label></div></section>
      <section className="settingsPanel"><header><BellRing/><div><p className="adminKicker">NOTIFICATIONS</p><h2>Inbox preferences</h2></div></header><p className="settingsHelp">These switches control new notifications. Existing inbox items remain available until each administrator clears them.</p><div className="settingsToggles"><label><span><b>New feedback</b><small>Notify administrators when a visitor submits feedback.</small></span><input type="checkbox" name="notifyFeedback" defaultChecked={current.notifyFeedback}/></label><label><span><b>Alumni registry</b><small>Notify other administrators when alumni records change.</small></span><input type="checkbox" name="notifyAlumni" defaultChecked={current.notifyAlumni}/></label><label><span><b>Access changes</b><small>Notify other administrators about account and role changes.</small></span><input type="checkbox" name="notifyAccess" defaultChecked={current.notifyAccess}/></label></div></section>
      <footer className="settingsFooter"><p><ShieldCheck size={15}/>Secrets and storage credentials stay server-side and are not editable here.</p><button type="submit" disabled={busy}>{busy ? <LoaderCircle className="queueSpinner"/> : <Save size={16}/>}Save settings</button></footer>
    </form>
    <form className="passwordPanel" onSubmit={submitPassword}>
      <header><KeyRound/><div><p className="adminKicker">ACCOUNT SECURITY</p><h2>Change your password</h2><span>Confirm your current password before choosing a new one.</span></div></header>
      {passwordMessage && <div className={`settingsMessage ${passwordOk ? "success" : "error"}`} role={passwordOk ? "status" : "alert"}>{passwordOk && <CheckCircle2 size={16}/>} {passwordMessage}</div>}
      <div className="passwordFields"><label><span>Current password</span><input name="currentPassword" type="password" required autoComplete="current-password"/></label><label><span>New password</span><input name="newPassword" type="password" required minLength={8} autoComplete="new-password"/><small>Use at least 8 characters with a letter and number.</small></label><label><span>Confirm new password</span><input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password"/></label></div>
      <button type="submit" disabled={passwordBusy}>{passwordBusy ? <LoaderCircle className="queueSpinner"/> : <KeyRound size={16}/>}Update my password</button>
    </form>
  </div>;
}
