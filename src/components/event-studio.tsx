"use client";

import Image from "next/image";
import { CalendarDays, CheckCircle2, Clock3, ImagePlus, LoaderCircle, MapPin, Pencil, Save, Trash2, UploadCloud } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent, saveEvent } from "@/app/admin/events/actions";

export type EventRecord = { id: string; title: string; titleKn: string | null; description: string | null; descriptionKn: string | null; eventDate: string; startTime: string | null; endTime: string | null; venue: string | null; venueKn: string | null; imagePath: string | null; status: "UPCOMING" | "COMPLETED" | "CANCELLED"; publication: "DRAFT" | "PUBLISHED" | "ARCHIVED" };

export function EventStudio({ events }: { events: EventRecord[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const selected = useMemo(() => events.find((event) => event.id === selectedId) ?? null, [events, selectedId]);
  const submit = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setBusy(true); setMessage(""); const result = await saveEvent(new FormData(event.currentTarget)); setBusy(false); setMessage(result.message); setMessageOk(result.ok); if (result.ok) { setSelectedId(null); setPreview(null); router.refresh(); } };
  return <div className="eventStudio">
    <section className="studioIntro"><div><p className="adminKicker">COMMUNITY CALENDAR</p><h1>Events</h1><p>Plan each gathering and publish a polished bilingual event experience.</p></div><div className="studioCount"><CalendarDays size={18}/><span>{events.length}</span><small>events</small></div></section>
    <div className="eventGrid">
      <form onSubmit={submit} className="eventEditor" key={selected?.id ?? "new"}>
        <input type="hidden" name="id" value={selected?.id ?? ""}/>
        <div className="studioPanelHeader"><div><p className="adminKicker">{selected ? "EDIT EVENT" : "NEW EVENT"}</p><h2>{selected ? "Refine event details" : "Create a gathering"}</h2></div>{selected && <button type="button" className="textButton" onClick={() => { setSelectedId(null); setPreview(null); }}>New event</button>}</div>
        <label className="eventUpload">{preview || selected?.imagePath ? <Image className="media-cover" src={preview ?? selected!.imagePath!} alt="Event image preview" fill sizes="(max-width: 900px) 100vw, 40vw" unoptimized/> : <><UploadCloud size={26}/><strong>Add event image</strong><span>Optional cover image for the public timeline</span></>}<input name="imageFile" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : null); }}/></label>
        <label><span>Event title · English</span><input name="title" required defaultValue={selected?.title ?? ""} placeholder="e.g. Annual alumni meet"/></label>
        <label><span>ಕಾರ್ಯಕ್ರಮದ ಶೀರ್ಷಿಕೆ · Kannada <em>optional</em></span><input name="titleKn" lang="kn" defaultValue={selected?.titleKn ?? ""}/></label>
        <label><span>Description · English <em>optional</em></span><textarea name="description" rows={4} defaultValue={selected?.description ?? ""}/></label>
        <label><span>ವಿವರಣೆ · Kannada <em>optional</em></span><textarea name="descriptionKn" lang="kn" rows={4} defaultValue={selected?.descriptionKn ?? ""}/></label>
        <div className="eventFields"><label><span>Date</span><input name="eventDate" type="date" required defaultValue={selected?.eventDate.slice(0, 10) ?? ""}/></label><label><span><Clock3 size={12}/> Start time</span><input name="startTime" type="time" defaultValue={selected?.startTime ?? ""}/></label><label><span><Clock3 size={12}/> End time</span><input name="endTime" type="time" defaultValue={selected?.endTime ?? ""}/></label></div>
        <label><span><MapPin size={12}/> Venue · English <em>optional</em></span><input name="venue" defaultValue={selected?.venue ?? ""}/></label>
        <label><span><MapPin size={12}/> ಸ್ಥಳ · Kannada <em>optional</em></span><input name="venueKn" lang="kn" defaultValue={selected?.venueKn ?? ""}/></label>
        <label><span>Image URL <em>optional if uploading</em></span><input name="imagePath" defaultValue={selected?.imagePath ?? ""} placeholder="https://..."/></label>
        <div className="eventFields two"><label><span>Event status</span><select name="status" defaultValue={selected?.status ?? "UPCOMING"}><option value="UPCOMING">Upcoming</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></label><label><span>Visibility</span><select name="publication" defaultValue={selected?.publication ?? "PUBLISHED"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label></div>
        {message && <p className={`editorActionMessage ${messageOk ? "success" : "error"}`} role={messageOk ? "status" : "alert"}>{messageOk && <CheckCircle2 size={15}/>} {message}</p>}
        <button className="studioSave" type="submit" disabled={busy}>{busy && <LoaderCircle className="queueSpinner" size={16}/>}<Save size={16}/>{selected ? "Save changes" : "Save event"}</button>
      </form>
      <section className="eventListPanel"><div className="studioPanelHeader"><div><p className="adminKicker">EVENT LIBRARY</p><h2>Current events</h2></div></div>{events.length ? <div className="eventCards">{events.map((event) => <article className={selected?.id === event.id ? "eventCard selected" : "eventCard"} key={event.id}>{event.imagePath ? <div className="eventImage"><Image className="media-cover" src={event.imagePath} alt={event.title} fill sizes="(max-width: 900px) 50vw, 30vw" unoptimized/></div> : <div className="eventImage empty"><CalendarDays size={23}/></div>}<div className="eventCardBody"><div className="eventCardMeta"><span>{new Date(event.eventDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</span><small>{event.publication.toLowerCase()}</small></div><h3>{event.title}</h3>{event.titleKn && <small lang="kn">{event.titleKn}</small>}<p>{event.venue ?? "Venue to be confirmed"}</p><footer><span>{event.status.toLowerCase()}</span><div><button type="button" aria-label={`Edit ${event.title}`} onClick={() => { setSelectedId(event.id); setPreview(null); }}><Pencil size={15}/></button><form action={deleteEvent}><input type="hidden" name="id" value={event.id}/><button type="submit" className="deleteEvent" aria-label={`Delete ${event.title}`}><Trash2 size={15}/></button></form></div></footer></div></article>)}</div> : <div className="eventEmpty"><ImagePlus size={25}/><h3>Plan the next gathering</h3><p>Publish your first event to populate the alumni calendar.</p></div>}</section>
    </div>
  </div>;
}
