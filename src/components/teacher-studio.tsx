"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, LoaderCircle, Pencil, Save, Search, Trash2, UserRound, X } from "lucide-react";
import { createTeacher, deleteTeacher, updateTeacher } from "@/app/admin/teachers/actions";
import { MAX_TEACHER_IMAGE_SIZE_MB, TEACHER_IMAGE_ACCEPT, validateTeacherImage } from "@/lib/teacher-images";
import { validateTeacherTenure } from "@/lib/teacher-tenure";

type AdminTeacher = { id: string; nameEn: string; nameKn: string | null; designationEn: string; designationKn: string | null; descriptionEn: string | null; descriptionKn: string | null; imageUrl: string; startYear: number; endYear: number | null; isCurrent: boolean; isPublished: boolean; sortOrder: number };

async function optimizePortrait(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("This image could not be processed."); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .84));
  return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }) : file;
}

function TenureFields({ teacher }: { teacher?: AdminTeacher }) {
  const [current, setCurrent] = useState(teacher?.isCurrent ?? false);
  const [endYear, setEndYear] = useState(teacher?.endYear?.toString() ?? "");
  const changeCurrent = (checked: boolean) => { setCurrent(checked); if (checked) setEndYear(""); };
  return <><div className="teacherFormGrid"><label><span>Start year *</span><input name="startYear" type="number" min="1900" max={new Date().getFullYear() + 1} required defaultValue={teacher?.startYear}/></label><label><span>End year {current ? "· Present" : "*"}</span><input name="endYear" type="number" min="1900" max={new Date().getFullYear() + 1} disabled={current} required={!current} value={endYear} onChange={(event) => setEndYear(event.target.value)}/></label><label><span>Display order</span><input name="sortOrder" type="number" min="0" defaultValue={teacher?.sortOrder ?? 0}/></label></div><div className="teacherChecks"><label><input name="isCurrent" type="checkbox" checked={current} onChange={(event) => changeCurrent(event.target.checked)}/>Currently working here</label><label><input name="isPublished" type="checkbox" defaultChecked={teacher?.isPublished}/>Published</label></div></>;
}

function validateTenure(form: HTMLFormElement) {
  const data = new FormData(form);
  const result = validateTeacherTenure(String(data.get("startYear") ?? ""), String(data.get("endYear") ?? ""), data.get("isCurrent") === "on");
  return result.ok ? null : result.message;
}

export function TeacherStudio({ teachers }: { teachers: AdminTeacher[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [createFile, setCreateFile] = useState<File | null>(null);
  const [createPreview, setCreatePreview] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState("");
  const [createFormKey, setCreateFormKey] = useState(0);
  const selected = useMemo(() => teachers.find((teacher) => teacher.id === selectedId) || null, [selectedId, teachers]);
  const filtered = useMemo(() => teachers.filter((teacher) => `${teacher.nameEn} ${teacher.nameKn || ""} ${teacher.designationEn}`.toLowerCase().includes(query.toLowerCase())), [query, teachers]);
  useEffect(() => () => { if (createPreview) URL.revokeObjectURL(createPreview); }, [createPreview]);
  useEffect(() => () => { if (editPreview) URL.revokeObjectURL(editPreview); }, [editPreview]);
  useEffect(() => {
    if (!selectedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedId(null); };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); };
  }, [selectedId]);
  const chooseImage = async (event: ChangeEvent<HTMLInputElement>, edit = false) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    const validationError = validateTeacherImage(file, true);
    if (validationError) { setMessage(validationError); input.value = ""; return; }
    try {
      const optimized = await optimizePortrait(file as File);
      const preview = URL.createObjectURL(optimized);
      if (edit) { setEditFile(optimized); setEditPreview(preview); }
      else { setCreateFile(optimized); setCreatePreview(preview); }
      setMessage("");
    } catch { setMessage("This image appears to be invalid or corrupted. Choose a valid JPG, PNG or WebP file."); input.value = ""; }
  };
  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!createFile) { setMessage("Choose a teacher photograph."); return; }
    const tenureError = validateTenure(form);
    if (tenureError) { setMessage(tenureError); return; }
    setSaving(true); setMessage("");
    const payload = new FormData(form); payload.set("image", createFile);
    const result = await createTeacher(payload); setSaving(false); setMessage(result.message);
    if (result.ok) { form.reset(); setCreatePreview(""); setCreateFile(null); setCreateFormKey((value) => value + 1); router.refresh(); }
  };
  const update = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const tenureError = validateTenure(form);
    if (tenureError) { setMessage(tenureError); return; }
    setSaving(true); setMessage("");
    const payload = new FormData(form); if (editFile) payload.set("image", editFile);
    const result = await updateTeacher(payload); setSaving(false); setMessage(result.message);
    if (result.ok) { setEditFile(null); setEditPreview(""); setSelectedId(null); router.refresh(); }
  };
  const remove = async (teacher: AdminTeacher) => {
    if (!window.confirm(`Delete ${teacher.nameEn}?\n\nThis permanently removes the profile and its stored photograph.`)) return;
    const payload = new FormData(); payload.set("id", teacher.id); setSaving(true); const result = await deleteTeacher(payload); setSaving(false); setMessage(result.message); if (result.ok) { setSelectedId(null); router.refresh(); }
  };
  const closeEditor = () => { setEditFile(null); setEditPreview(""); setSelectedId(null); };
  return <div className="teacherStudio">
    <section className="studioIntro"><div><p className="adminKicker">SCHOOL HERITAGE</p><h1>Teachers</h1><p>Document the teachers and mentors who shaped the school across generations.</p></div><div className="studioCount"><UserRound size={18}/><span>{teachers.length}</span><small>profiles</small></div></section>
    {message && <div id="teacher-form-message" className="teacherAdminMessage" role="status">{message}</div>}
    <div className="teacherAdminLayout">
      <form className="teacherEditorPanel" onSubmit={create} aria-busy={saving}><div className="studioPanelHeader"><div><p className="adminKicker">NEW PROFILE</p><h2>Add a teacher</h2></div></div>
        <label className="teacherImagePicker">{createPreview ? <Image className="media-cover media-portrait" src={createPreview} alt="New teacher preview" fill unoptimized/> : <><ImagePlus size={27}/><strong>Choose portrait</strong><span>JPG, PNG or WebP · maximum {MAX_TEACHER_IMAGE_SIZE_MB} MB</span></>}<input type="file" accept={TEACHER_IMAGE_ACCEPT} onChange={(event) => void chooseImage(event)}/></label>
        <div className="teacherFormGrid"><label><span>Name · English *</span><input name="nameEn" required/></label><label><span>ಹೆಸರು · Kannada</span><input name="nameKn" lang="kn"/></label><label><span>Designation · English *</span><input name="designationEn" required/></label><label><span>ಹುದ್ದೆ · Kannada</span><input name="designationKn" lang="kn"/></label></div>
        <label><span>Description · English <em>optional</em></span><textarea name="descriptionEn" rows={3}/></label><label><span>ವಿವರಣೆ · Kannada <em>optional</em></span><textarea name="descriptionKn" lang="kn" rows={3}/></label>
        <TenureFields key={createFormKey}/><button className="studioSave" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="queueSpinner"/>Uploading…</> : <><Save size={16}/>Create teacher profile</>}</button>
      </form>
      <section className="teacherLibrary"><div className="teacherLibraryHead"><div><p className="adminKicker">TEACHER ARCHIVE</p><h2>Current and former faculty</h2></div><label><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachers…"/></label></div>
        {filtered.length ? <div className="teacherAdminList">{filtered.map((teacher) => <article key={teacher.id}><div className="teacherAdminThumb">{teacher.imageUrl ? <Image className="media-cover media-portrait" src={teacher.imageUrl} alt="" fill sizes="72px" unoptimized={teacher.imageUrl.includes(".supabase.co/")}/> : <UserRound/>}</div><div><strong>{teacher.nameEn}</strong><span>{teacher.designationEn}</span><small>{teacher.startYear} – {teacher.isCurrent ? "Present" : teacher.endYear}</small></div><div className="teacherAdminBadges"><span className={teacher.isCurrent ? "current" : "former"}>{teacher.isCurrent ? "Current" : "Former"}</span><span className={teacher.isPublished ? "published" : "draft"}>{teacher.isPublished ? "Published" : "Draft"}</span></div><div className="teacherAdminActions"><button type="button" onClick={() => setSelectedId(teacher.id)} aria-label={`Edit ${teacher.nameEn}`}><Pencil/></button><button className="danger" type="button" onClick={() => remove(teacher)} aria-label={`Delete ${teacher.nameEn}`}><Trash2/></button></div></article>)}</div> : <div className="teacherAdminEmpty"><UserRound/><h3>{teachers.length ? "No matching teachers" : "No teacher profiles yet"}</h3><p>{teachers.length ? "Try another search." : "Add the first verified teacher profile when the record is ready."}</p></div>}
      </section>
    </div>
    {selected && <div className="teacherModalBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor(); }}><form className="teacherModal" onSubmit={update} role="dialog" aria-modal="true" aria-labelledby="teacher-editor-title" aria-busy={saving}><div className="teacherModalHead"><div><p className="adminKicker">PROFILE EDITOR</p><h2 id="teacher-editor-title">Edit teacher</h2></div><button type="button" onClick={closeEditor} aria-label="Close editor" autoFocus><X/></button></div><input type="hidden" name="id" value={selected.id}/>
      <label className="teacherImagePicker compact">{editPreview || selected.imageUrl ? <Image className="media-cover media-portrait" src={editPreview || selected.imageUrl} alt={`${selected.nameEn} preview`} fill unoptimized={Boolean(editPreview) || selected.imageUrl.includes(".supabase.co/")}/> : <><ImagePlus/><strong>Add portrait</strong></>}<input type="file" accept={TEACHER_IMAGE_ACCEPT} onChange={(event) => void chooseImage(event, true)}/></label>
      <div className="teacherFormGrid"><label><span>Name · English *</span><input name="nameEn" required defaultValue={selected.nameEn}/></label><label><span>ಹೆಸರು · Kannada</span><input name="nameKn" lang="kn" defaultValue={selected.nameKn || ""}/></label><label><span>Designation · English *</span><input name="designationEn" required defaultValue={selected.designationEn}/></label><label><span>ಹುದ್ದೆ · Kannada</span><input name="designationKn" lang="kn" defaultValue={selected.designationKn || ""}/></label></div>
      <label><span>Description · English</span><textarea name="descriptionEn" rows={3} defaultValue={selected.descriptionEn || ""}/></label><label><span>ವಿವರಣೆ · Kannada</span><textarea name="descriptionKn" lang="kn" rows={3} defaultValue={selected.descriptionKn || ""}/></label><TenureFields key={selected.id} teacher={selected}/>
      {selected.imageUrl && <div className="teacherChecks"><label><input name="removeImage" type="checkbox"/>Remove photograph and unpublish profile</label></div>}<button className="studioSave" type="submit" disabled={saving}>{saving ? <><LoaderCircle className="queueSpinner"/>Uploading…</> : <><Save/>Save changes</>}</button>
    </form></div>}
  </div>;
}
