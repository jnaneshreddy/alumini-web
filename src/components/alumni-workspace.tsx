"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BadgeCheck, CheckCircle2, CircleX, Download, FileSpreadsheet, FileText, Filter, GraduationCap, LoaderCircle, Pencil, Plus, Search, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { approveAlumniProfile, deleteAlumniProfile, denyAlumniProfile, saveAlumniProfile } from "@/app/admin/alumni/actions";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";
const statusLabel = (status: VerificationStatus) => status === "VERIFIED" ? "approved" : status.toLowerCase();
export type AlumniRecord = {
  id: string;
  fullName: string;
  registrantType?: "ALUMNI" | "STUDENT" | "TEACHER";
  email: string | null;
  phone: string | null;
  batch: string;
  graduationYear: number | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
};

export function AlumniWorkspace({ records }: { records: AlumniRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | VerificationStatus>("ALL");
  const [selected, setSelected] = useState<AlumniRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const exportRows = records.map((record) => ({
    Name: record.fullName,
    Type: record.registrantType ?? "ALUMNI",
    Email: record.email ?? "",
    Phone: record.phone ?? "",
    Batch: record.batch,
    "Graduation year": record.graduationYear ?? "",
    Status: statusLabel(record.verificationStatus),
    "Registered on": new Date(record.createdAt).toLocaleDateString("en-GB"),
  }));
  const filtered = useMemo(() => records.filter((record) => (
    (status === "ALL" || record.verificationStatus === status)
    && `${record.fullName} ${record.email ?? ""} ${record.phone ?? ""} ${record.batch} ${record.graduationYear ?? ""}`.toLowerCase().includes(query.toLowerCase())
  )), [records, query, status]);
  useEffect(() => {
    if (!editorOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setEditorOpen(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [editorOpen]);
  const openEditor = (record: AlumniRecord | null) => { setSelected(record); setEditorOpen(true); setMessage(""); };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await saveAlumniProfile(new FormData(event.currentTarget));
    setBusy(false);
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) {
      setEditorOpen(false);
      setSelected(null);
      router.refresh();
    }
  };
  const approve = async (record: AlumniRecord) => {
    setBusy(true);
    setMessage("");
    const result = await approveAlumniProfile(record.id);
    setBusy(false);
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) router.refresh();
  };
  const deny = async (record: AlumniRecord) => {
    setBusy(true);
    setMessage("");
    const result = await denyAlumniProfile(record.id);
    setBusy(false);
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) router.refresh();
  };
  const remove = async (record: AlumniRecord) => {
    if (!window.confirm(`Delete ${record.fullName}'s profile permanently? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    const result = await deleteAlumniProfile(record.id);
    setBusy(false);
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) router.refresh();
  };
  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  const exportCsv = () => {
    const headers = Object.keys(exportRows[0] ?? { Name: "" });
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const content = [headers.map(escape).join(","), ...exportRows.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))].join("\n");
    download(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }), "mdrs-alumni-directory.csv");
  };
  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    sheet["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Alumni directory");
    XLSX.writeFile(workbook, "mdrs-alumni-directory.xlsx");
  };
  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const columns = ["Name", "Type", "Email", "Phone", "Batch", "Year", "Status"];
    let y = 44;
    const addHeader = () => { pdf.setFont("helvetica", "bold"); pdf.setFontSize(15); pdf.text("MDRS Alumni Directory", 40, y); y += 25; pdf.setFontSize(8); pdf.text(columns, 40, y); y += 14; pdf.setDrawColor(170); pdf.line(40, y, 800, y); y += 13; pdf.setFont("helvetica", "normal"); };
    addHeader();
    exportRows.forEach((row) => {
      if (y > 545) { pdf.addPage(); y = 44; addHeader(); }
      const values = [row.Name, row.Type, row.Email, row.Phone, row.Batch, String(row["Graduation year"]), row.Status];
      const positions = [40, 180, 255, 410, 520, 610, 675];
      pdf.setFontSize(8);
      values.forEach((value, index) => pdf.text(String(value).slice(0, index === 0 ? 23 : 18), positions[index], y));
      y += 17;
    });
    pdf.save("mdrs-alumni-directory.pdf");
  };

  return <div className="alumniWorkspace">
    <section className="usersHeader">
      <div>
        <p className="adminKicker">ALUMNI DIRECTORY</p>
        <h1>Alumni list</h1>
        <span>Add and manage alumni records with their name, email, phone number, batch and graduation year.</span>
      </div>
      <div className="alumniHeaderActions"><div className="alumniExportActions"><button type="button" onClick={exportCsv} disabled={!records.length}><Download/>CSV</button><button type="button" onClick={exportExcel} disabled={!records.length}><FileSpreadsheet/>Excel</button><button type="button" onClick={exportPdf} disabled={!records.length}><FileText/>PDF</button></div><button className="addUserButton" type="button" onClick={() => openEditor(null)}><Plus/>Add alumni</button></div>
    </section>
    {message && !editorOpen && <div className={`settingsMessage ${messageOk ? "success" : "error"}`} role={messageOk ? "status" : "alert"}>{messageOk && <CheckCircle2 size={16}/>} {message}</div>}
    <section className="userMetrics alumniMetrics">
      <article><Users size={18}/><p>Total alumni</p><b>{records.length}</b></article>
      <article><BadgeCheck size={18}/><p>Approved profiles</p><b>{records.filter((record) => record.verificationStatus === "VERIFIED").length}</b></article>
      <article><GraduationCap size={18}/><p>Pending review</p><b>{records.filter((record) => record.verificationStatus === "PENDING").length}</b></article>
    </section>
    <section className="usersPanel alumniPanel">
      <div className="usersToolbar">
        <div className="userSearch"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name, email, phone, batch or year" aria-label="Search alumni"/></div>
        <div className="userFilters"><label><Filter size={15}/><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Filter alumni by verification"><option value="ALL">All alumni</option><option value="PENDING">Pending</option><option value="VERIFIED">Approved</option><option value="REJECTED">Rejected</option></select></label></div>
      </div>
      <div className="usersTable alumniTable">
        <table>
          <thead><tr><th>Registrant</th><th>Email</th><th>Phone</th><th>Batch & year</th><th>Verification</th><th><span className="srOnly">Actions</span></th></tr></thead>
          <tbody>{filtered.length ? filtered.map((record) => <tr key={record.id}>
            <td><div className="userIdentity"><span>{record.fullName.slice(0, 1).toUpperCase()}</span><div><b>{record.fullName}</b><small>{(record.registrantType ?? "ALUMNI").toLowerCase()} · Added {new Date(record.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</small></div></div></td>
            <td>{record.email}</td>
            <td>{record.phone}</td>
            <td><b className="alumniBatch">{record.batch}</b><small className="alumniYear">Class of {record.graduationYear}</small></td>
            <td><span className={`alumniStatus ${record.verificationStatus.toLowerCase()}`}>{statusLabel(record.verificationStatus)}</span></td>
            <td><div className="userRowActions">{record.verificationStatus !== "VERIFIED" && <button className="alumniApproveButton" type="button" onClick={() => approve(record)} disabled={busy} aria-label={`Approve ${record.fullName}`} title="Approve profile"><ShieldCheck/><span>Approve</span></button>}{record.verificationStatus === "PENDING" && <button className="alumniDenyButton" type="button" onClick={() => deny(record)} disabled={busy} aria-label={`Deny ${record.fullName}`} title="Deny registration"><CircleX/><span>Deny</span></button>}<button type="button" onClick={() => openEditor(record)} aria-label={`Edit ${record.fullName}`} title="Edit profile"><Pencil/></button><button className="alumniDeleteButton" type="button" onClick={() => remove(record)} disabled={busy} aria-label={`Delete ${record.fullName}`} title="Delete profile"><Trash2/></button></div></td>
          </tr>) : <tr><td colSpan={6}><div className="usersEmpty"><GraduationCap size={26}/><b>No alumni records yet</b><small>Use Add alumni to create the first directory record.</small></div></td></tr>}</tbody>
        </table>
      </div>
    </section>
    {editorOpen && <div className="userDialogBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
      <form key={selected?.id ?? "new"} className="userDialog alumniEditor" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="alumni-editor-title">
        <header><div><p className="adminKicker">ALUMNI DIRECTORY</p><h2 id="alumni-editor-title">{selected ? "Edit alumni" : "Add alumni"}</h2></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Close editor" autoFocus><X/></button></header>
        <input type="hidden" name="id" value={selected?.id ?? ""}/>
        <div className="alumniFormGrid">
          <label className="wide"><span>Full name</span><input name="fullName" required minLength={2} defaultValue={selected?.fullName ?? ""}/></label>
          <label><span>Registrant type</span><select name="registrantType" defaultValue={selected?.registrantType ?? "ALUMNI"}><option value="ALUMNI">Alumni</option><option value="STUDENT">Student</option><option value="TEACHER">Teacher</option></select></label>
          <label><span>Email address</span><input name="email" type="email" required defaultValue={selected?.email ?? ""}/></label>
          <label><span>Phone number</span><input name="phone" type="tel" required defaultValue={selected?.phone ?? ""}/></label>
          <label><span>Batch</span><input name="batch" required placeholder="Example: 2012-13" defaultValue={selected?.batch ?? ""}/></label>
          <label><span>Graduation year</span><input name="graduationYear" type="number" required min="1900" max={new Date().getFullYear() + 1} defaultValue={selected?.graduationYear ?? ""}/></label>
        </div>
        <p className="alumniFormHint">A directory record starts as private and pending verification. The avatar is generated from the first letter of the alumni&apos;s name.</p>
        {message && editorOpen && <p className="dialogError" role="alert">{message}</p>}
        <div className="dialogActions"><button type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button type="submit" disabled={busy}>{busy && <LoaderCircle className="queueSpinner"/>}{selected ? "Save changes" : "Add alumni"}</button></div>
      </form>
    </div>}
  </div>;
}
