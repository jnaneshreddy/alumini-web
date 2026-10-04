"use client";

import Image from "next/image";
import { CheckCircle2, ImagePlus, LoaderCircle, Pencil, Save, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCarouselSlide, saveCarouselSlide } from "@/app/admin/carousel/actions";

export type CarouselSlideRecord = { id: string; title: string; caption: string | null; imagePath: string; altText: string; position: number; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" };

export function CarouselStudio({ slides }: { slides: CarouselSlideRecord[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const selected = useMemo(() => slides.find((slide) => slide.id === selectedId) ?? null, [selectedId, slides]);
  useEffect(() => () => { if (filePreview) URL.revokeObjectURL(filePreview); }, [filePreview]);
  const resetEditor = () => { setSelectedId(null); setFilePreview(null); };
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true); setMessage(""); const result = await saveCarouselSlide(data); setBusy(false); setMessage(result.message); setMessageOk(result.ok); if (result.ok) { form.reset(); resetEditor(); router.refresh(); } };
  return <div className="mediaStudio">
    <section className="studioIntro"><div><p className="adminKicker">CONTENT LIBRARY</p><h1>Carousel media</h1><p>Curate the visual story shown on the public homepage.</p></div><div className="studioCount"><ImagePlus size={18} /><span>{slides.length}</span><small>slides</small></div></section>
    <div className="studioGrid">
      <form onSubmit={submit} className="studioEditor" key={selected?.id ?? "new"}>
        <input type="hidden" name="id" value={selected?.id ?? ""} />
        <div className="studioPanelHeader"><div><p className="adminKicker">{selected ? "EDIT SLIDE" : "NEW SLIDE"}</p><h2>{selected ? "Refine this slide" : "Add a homepage image"}</h2></div>{selected && <button className="textButton" type="button" onClick={resetEditor}>New slide</button>}</div>
        <label className="uploadZone">{filePreview || selected?.imagePath ? <Image className="media-cover" src={filePreview ?? selected!.imagePath} alt="Selected slide preview" fill sizes="(max-width: 900px) 100vw, 36vw" unoptimized /> : <><UploadCloud size={28} /><strong>Drop an image here</strong><span>or choose a file from your computer</span></>}<input name="imageFile" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; setFilePreview(file ? URL.createObjectURL(file) : null); }} /></label>
        <div className="studioFields twoColumns"><label><span>Slide title</span><input name="title" required defaultValue={selected?.title ?? ""} placeholder="e.g. Alumni reunion 2026" /></label><label><span>Display order</span><input name="position" type="number" min="0" defaultValue={selected?.position ?? slides.length} /></label></div>
        <label className="studioFields"><span>Caption <em>optional</em></span><textarea name="caption" rows={3} defaultValue={selected?.caption ?? ""} placeholder="A short line to accompany this image" /></label>
        <label className="studioFields"><span>Image URL <em>optional if uploading</em></span><input name="imagePath" defaultValue={selected?.imagePath ?? ""} placeholder="https://..." /></label>
        <div className="studioFields twoColumns"><label><span>Accessible description</span><input name="altText" required defaultValue={selected?.altText ?? ""} placeholder="Describe the image" /></label><label><span>Visibility</span><select name="status" defaultValue={selected?.status ?? "PUBLISHED"}><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select></label></div>
        {message && <p className={`editorActionMessage ${messageOk ? "success" : "error"}`} role={messageOk ? "status" : "alert"}>{messageOk && <CheckCircle2 size={15}/>} {message}</p>}
        <button className="studioSave" type="submit" disabled={busy}>{busy && <LoaderCircle className="queueSpinner" size={16}/>}<Save size={16} />{selected ? "Save changes" : "Save slide"}</button>
      </form>
      <section className="studioGallery" aria-label="Existing carousel slides"><div className="studioPanelHeader"><div><p className="adminKicker">MEDIA GALLERY</p><h2>Published and draft slides</h2></div></div>{slides.length ? <div className="slideGallery">{slides.map((slide) => <article className={selected?.id === slide.id ? "slideCard selected" : "slideCard"} key={slide.id}><div className="slideThumbnail"><Image className="media-cover" src={slide.imagePath} alt={slide.altText} fill sizes="(max-width: 900px) 50vw, 20vw" unoptimized /><span>{slide.status.toLowerCase()}</span></div><div className="slideCardBody"><div><h3>{slide.title}</h3><p>Position {slide.position}</p></div><div className="slideCardActions"><button type="button" aria-label={`Edit ${slide.title}`} onClick={() => { setSelectedId(slide.id); setFilePreview(null); }}><Pencil size={15} /></button><form action={deleteCarouselSlide}><input type="hidden" name="id" value={slide.id} /><button type="submit" aria-label={`Delete ${slide.title}`} className="deleteSlide"><Trash2 size={15} /></button></form></div></div></article>)}</div> : <div className="studioEmpty"><ImagePlus size={24} /><h3>Your gallery is ready</h3><p>Add the first image to create a dynamic homepage carousel.</p></div>}</section>
    </div>
  </div>;
}
