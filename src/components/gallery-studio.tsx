"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { Check, Grid2X2, ImagePlus, List, LoaderCircle, Pencil, Save, Trash2, UploadCloud, X } from "lucide-react";
import { deleteGalleryImage, updateGalleryImage, uploadGalleryImage } from "@/app/admin/gallery/actions";
import { galleryCategories, galleryCategoryLabels } from "@/lib/gallery";

type GalleryAdminImage = {
  id: string; titleEn: string | null; titleKn: string | null; descriptionEn: string | null; descriptionKn: string | null; altText: string; imageUrl: string; category: string; galleryType: string; eventId: string | null; date: string | null; isFeatured: boolean; isPublished: boolean; sortOrder: number;
};
type EventOption = { id: string; title: string };
type QueueItem = { key: string; file: File; preview: string; status: "ready" | "uploading" | "success" | "error"; message?: string };

export function GalleryStudio({ images, events, defaultType }: { images: GalleryAdminImage[]; events: EventOption[]; defaultType: "PHOTO_GALLERY" | "MEMORY" }) {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = useMemo(() => images.find((image) => image.id === selectedId) || null, [images, selectedId]);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = [...files].map((file) => ({ key: crypto.randomUUID(), file, preview: URL.createObjectURL(file), status: "ready" as const }));
    setQueue((current) => [...current, ...next]);
  };
  const removeQueue = (key: string) => setQueue((current) => { const item = current.find((entry) => entry.key === key); if (item) URL.revokeObjectURL(item.preview); return current.filter((entry) => entry.key !== key); });
  const upload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queue.length) { setMessage("Choose one or more JPG, PNG or WEBP images."); return; }
    setSaving(true); setMessage("");
    const base = new FormData(event.currentTarget);
    for (const item of queue) {
      if (item.status === "success") continue;
      setQueue((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: "uploading", message: undefined } : entry));
      const payload = new FormData();
      base.forEach((value, key) => payload.append(key, value));
      payload.set("image", item.file);
      const result = await uploadGalleryImage(payload);
      setQueue((current) => current.map((entry) => entry.key === item.key ? { ...entry, status: result.ok ? "success" : "error", message: result.message } : entry));
    }
    setSaving(false); setMessage("Upload queue finished. Failed files can be removed or retried."); router.refresh();
  };
  const update = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setSaving(true); const result = await updateGalleryImage(new FormData(event.currentTarget)); setMessage(result.ok ? "Photo details updated successfully. You can now edit another photo." : result.message); setSaving(false); if (result.ok) { setSelectedId(null); router.refresh(); } };
  const remove = async (image: GalleryAdminImage) => { if (!window.confirm(`Delete ${image.titleEn || "this photo"}?\n\nDeleting this photo will remove it from the public gallery.`)) return; const payload = new FormData(); payload.set("id", image.id); const result = await deleteGalleryImage(payload); setMessage(result.message); if (result.ok) { setSelectedId(null); router.refresh(); } };
  return <div className="galleryStudio">
    <section className="studioIntro"><div><p className="adminKicker">DIGITAL SCHOOL ARCHIVE</p><h1>{defaultType === "MEMORY" ? "Memories" : "Photo gallery"}</h1><p>Upload, document and publish photographs without duplicating the underlying media library.</p></div><div className="studioCount"><ImagePlus size={18}/><span>{images.length}</span><small>records</small></div></section>
    {message && <div className="galleryAdminMessage" role="status">{message}</div>}
    <div className="galleryAdminLayout">
      <form className="galleryUploadPanel" onSubmit={upload}>
        <div className="studioPanelHeader"><div><p className="adminKicker">MULTI-IMAGE UPLOAD</p><h2>Add to the archive</h2></div></div>
        <label className="galleryDropzone"><UploadCloud size={28}/><strong>Select photographs</strong><span>JPG, PNG or WEBP · maximum 10 MB each</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => addFiles(event.target.files)}/></label>
        {queue.length > 0 && <div className="uploadQueue">{queue.map((item) => <article key={item.key}><div><Image src={item.preview} alt="" fill unoptimized/></div><span><b>{item.file.name}</b><small>{item.status === "uploading" ? "Uploading…" : item.message || `${(item.file.size / 1024 / 1024).toFixed(1)} MB`}</small></span>{item.status === "uploading" ? <LoaderCircle className="queueSpinner"/> : item.status === "success" ? <Check className="queueSuccess"/> : <button type="button" onClick={() => removeQueue(item.key)} aria-label={`Remove ${item.file.name}`}><X/></button>}</article>)}</div>}
        <div className="galleryFormGrid"><label><span>Gallery type</span><select name="galleryType" defaultValue={defaultType}><option value="PHOTO_GALLERY">Photo Gallery</option><option value="MEMORY">Memory</option></select></label><label><span>Category</span><select name="category">{galleryCategories.map((category) => <option key={category} value={category}>{galleryCategoryLabels[category].en}</option>)}</select></label></div>
        <label><span>Title · English <em>optional</em></span><input name="titleEn"/></label><label><span>ಶೀರ್ಷಿಕೆ · Kannada <em>optional</em></span><input name="titleKn" lang="kn"/></label>
        <label><span>Accessible image description</span><input name="altText" placeholder="Defaults to title or file name"/></label>
        <label><span>Description · English <em>optional</em></span><textarea name="descriptionEn" rows={3}/></label><label><span>ವಿವರಣೆ · Kannada <em>optional</em></span><textarea name="descriptionKn" lang="kn" rows={3}/></label>
        <div className="galleryFormGrid"><label><span>Date <em>optional</em></span><input name="date" type="date"/></label><label><span>Related event <em>optional</em></span><select name="eventId"><option value="">No event</option>{events.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label><span>Display order</span><input name="sortOrder" type="number" min="0" defaultValue="0"/></label></div>
        <div className="galleryChecks"><label><input type="checkbox" name="isPublished"/>Published</label><label><input type="checkbox" name="isFeatured"/>Featured on homepage</label></div>
        <button className="studioSave" type="submit" disabled={saving}>{saving ? <LoaderCircle className="queueSpinner"/> : <UploadCloud size={16}/>}Upload {queue.length || "photos"}</button>
      </form>
      <section className="galleryLibrary">
        <div className="galleryLibraryHead"><div><p className="adminKicker">MEDIA LIBRARY</p><h2>Published and draft photographs</h2></div><div><button type="button" className={view === "grid" ? "active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><Grid2X2/></button><button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")} aria-label="List view"><List/></button></div></div>
        {images.length ? <div className={`galleryAdminItems ${view}`}>{images.map((image) => <article key={image.id} className={selectedId === image.id ? "selected" : ""}><div className="galleryAdminThumb"><Image src={image.imageUrl} alt={image.altText} fill sizes="(max-width:900px) 50vw, 22vw" unoptimized={image.imageUrl.includes(".supabase.co/")}/><span>{image.isPublished ? "Published" : "Draft"}</span>{image.isFeatured && <b>Featured</b>}</div><div className="galleryAdminCardBody"><span><strong>{image.titleEn || "Untitled photograph"}</strong><small>{galleryCategoryLabels[image.category as keyof typeof galleryCategoryLabels]?.en || image.category}</small></span><div><button type="button" onClick={() => setSelectedId(image.id)} aria-label={`Edit ${image.titleEn || "photo"}`}><Pencil/></button><button type="button" className="danger" onClick={() => remove(image)} aria-label={`Delete ${image.titleEn || "photo"}`}><Trash2/></button></div></div></article>)}</div> : <div className="galleryAdminEmpty"><ImagePlus/><h3>No photographs in this collection</h3><p>Upload verified school photographs when they are ready.</p></div>}
      </section>
    </div>
    {selected && <div className="galleryEditorBackdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}><form className="galleryEditor" onSubmit={update}><div className="galleryEditorHead"><div><p className="adminKicker">PHOTO EDITOR</p><h2>Edit metadata</h2></div><button type="button" onClick={() => setSelectedId(null)} aria-label="Close editor"><X/></button></div><div className="galleryEditorPreview"><Image src={selected.imageUrl} alt={selected.altText} fill unoptimized={selected.imageUrl.includes(".supabase.co/")}/></div><input type="hidden" name="id" value={selected.id}/>
      <div className="galleryFormGrid"><label><span>Gallery type</span><select name="galleryType" defaultValue={selected.galleryType}><option value="PHOTO_GALLERY">Photo Gallery</option><option value="MEMORY">Memory</option></select></label><label><span>Category</span><select name="category" defaultValue={selected.category}>{galleryCategories.map((category) => <option key={category} value={category}>{galleryCategoryLabels[category].en}</option>)}</select></label></div>
      <label><span>Title · English</span><input name="titleEn" defaultValue={selected.titleEn || ""}/></label><label><span>ಶೀರ್ಷಿಕೆ · Kannada</span><input name="titleKn" lang="kn" defaultValue={selected.titleKn || ""}/></label><label><span>Accessible image description</span><input name="altText" required defaultValue={selected.altText}/></label><label><span>Description · English</span><textarea name="descriptionEn" rows={3} defaultValue={selected.descriptionEn || ""}/></label><label><span>ವಿವರಣೆ · Kannada</span><textarea name="descriptionKn" lang="kn" rows={3} defaultValue={selected.descriptionKn || ""}/></label>
      <div className="galleryFormGrid"><label><span>Date</span><input name="date" type="date" defaultValue={selected.date?.slice(0,10) || ""}/></label><label><span>Related event</span><select name="eventId" defaultValue={selected.eventId || ""}><option value="">No event</option>{events.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label><label><span>Display order</span><input name="sortOrder" type="number" min="0" defaultValue={selected.sortOrder}/></label></div>
      <div className="galleryChecks"><label><input type="checkbox" name="isPublished" defaultChecked={selected.isPublished}/>Published</label><label><input type="checkbox" name="isFeatured" defaultChecked={selected.isFeatured}/>Featured on homepage</label></div><button className="studioSave" type="submit" disabled={saving}>{saving ? <LoaderCircle className="queueSpinner"/> : <Save/>}Save changes</button>
    </form></div>}
  </div>;
}
