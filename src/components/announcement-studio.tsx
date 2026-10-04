"use client";

import { CalendarClock, CheckCircle2, FilePenLine, LoaderCircle, Megaphone, Pencil, Save, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAnnouncement, saveAnnouncement } from "@/app/admin/announcements/actions";

export type AnnouncementRecord = { id: string; title: string; titleKn: string | null; body: string; bodyKn: string | null; priority: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED"; publishedAt: string | null; createdAt: string };

export function AnnouncementStudio({ announcements }: { announcements: AnnouncementRecord[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const selected = useMemo(() => announcements.find((entry) => entry.id === selectedId) ?? null, [announcements, selectedId]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    const result = await saveAnnouncement(data);
    setBusy(false);
    setMessage(result.message);
    setMessageOk(result.ok);
    if (result.ok) {
      setSelectedId(null);
      router.refresh();
    }
  };
  return <div className="announcementStudio">
    <section className="studioIntro"><div><p className="adminKicker">COMMUNICATIONS</p><h1>Announcements</h1><p>Draft, schedule, and publish bilingual updates for the alumni community.</p></div><div className="studioCount"><Megaphone size={18}/><span>{announcements.length}</span><small>updates</small></div></section>
    <div className="announcementGrid">
      <form onSubmit={submit} className="announcementEditor" key={selected?.id ?? "new"}>
        <input type="hidden" name="id" value={selected?.id ?? ""}/>
        <div className="studioPanelHeader"><div><p className="adminKicker">{selected ? "EDIT ANNOUNCEMENT" : "COMPOSE"}</p><h2>{selected ? "Update this message" : "Create an update"}</h2></div>{selected && <button className="textButton" type="button" onClick={() => setSelectedId(null)}>New announcement</button>}</div>
        <label><span>Headline · English</span><input name="title" required defaultValue={selected?.title ?? ""}/></label>
        <label><span>ಶೀರ್ಷಿಕೆ · Kannada <em>optional</em></span><input name="titleKn" lang="kn" defaultValue={selected?.titleKn ?? ""}/></label>
        <label><span>Message · English</span><textarea name="body" required rows={7} defaultValue={selected?.body ?? ""}/></label>
        <label><span>ಪ್ರಕಟಣೆಯ ವಿಷಯ · Kannada <em>optional</em></span><textarea name="bodyKn" lang="kn" rows={7} defaultValue={selected?.bodyKn ?? ""}/></label>
        <div className="announcementFields"><label><span>Priority</span><select name="priority" defaultValue={selected?.priority ?? "GENERAL"}><option value="GENERAL">General</option><option value="IMPORTANT">Important</option><option value="URGENT">Urgent</option></select></label><label><span>Publication status</span><select name="status" defaultValue={selected?.status ?? "DRAFT"}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label></div>
        <label><span>Schedule publication <em>optional</em></span><input name="publishedAt" type="datetime-local" defaultValue={selected?.publishedAt ? selected.publishedAt.slice(0, 16) : ""}/></label>
        {message && <p className={`editorActionMessage ${messageOk ? "success" : "error"}`} role={messageOk ? "status" : "alert"}>{messageOk && <CheckCircle2 size={15}/>} {message}</p>}
        <button className="studioSave" type="submit" disabled={busy}>{busy && <LoaderCircle className="queueSpinner" size={16}/>}<Save size={16}/>{selected ? "Save changes" : "Save announcement"}</button>
      </form>
      <section className="announcementListPanel"><div className="studioPanelHeader"><div><p className="adminKicker">PUBLISHING QUEUE</p><h2>All announcements</h2></div></div>{announcements.length ? <div className="announcementCards">{announcements.map((item) => <article className={selected?.id === item.id ? "announcementCard selected" : "announcementCard"} key={item.id}><div className="announcementCardTop"><span className={`priorityBadge ${item.priority.toLowerCase()}`}>{item.priority}</span><span className={`statusBadge ${item.status.toLowerCase()}`}>{item.status.toLowerCase()}</span></div><h3>{item.title}</h3>{item.titleKn && <small lang="kn">{item.titleKn}</small>}<p>{item.body}</p><footer><span><CalendarClock size={13}/>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not scheduled"}</span><div><button type="button" aria-label={`Edit ${item.title}`} onClick={() => setSelectedId(item.id)}><Pencil size={15}/></button><form action={deleteAnnouncement}><input type="hidden" name="id" value={item.id}/><button className="deleteAnnouncement" type="submit" aria-label={`Delete ${item.title}`}><Trash2 size={15}/></button></form></div></footer></article>)}</div> : <div className="announcementEmpty"><FilePenLine size={26}/><h3>Ready for your first update</h3><p>Compose an announcement to keep the community informed.</p></div>}</section>
    </div>
  </div>;
}
