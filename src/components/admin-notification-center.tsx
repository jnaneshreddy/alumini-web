"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Inbox, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";

type NotificationItem = { id: string; title: string; message: string; category: string; href: string | null; readAt: string | null; createdAt: string };
type NotificationPayload = { notifications: NotificationItem[]; unreadCount: number; portalName: string; profile: { fullName: string; role: string } };

export function AdminNotificationCenter({ onIdentity }: { onIdentity: (identity: { portalName: string; fullName: string; role: string }) => void }) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const requestRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const load = useCallback(async () => {
    if (requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      if (!response.ok) {
        if (mountedRef.current) setLoadError(true);
        return;
      }
      const data = await response.json() as NotificationPayload;
      if (!mountedRef.current) return;
      setItems(data.notifications); setUnread(data.unreadCount); setLoadError(false);
      onIdentity({ portalName: data.portalName, fullName: data.profile.fullName, role: data.profile.role });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (mountedRef.current) setLoadError(true);
      console.warn("Unable to load admin notifications; polling will retry.");
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
      if (mountedRef.current) setLoading(false);
    }
  }, [onIdentity]);
  useEffect(() => {
    mountedRef.current = true;
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { mountedRef.current = false; window.clearTimeout(initial); window.clearInterval(timer); requestRef.current?.abort(); requestRef.current = null; };
  }, [load]);
  const mutate = async (action: string, id?: string) => {
    try {
      const response = await fetch("/api/admin/notifications", { method: "PATCH", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id }) });
      if (response.ok) await load();
      else if (mountedRef.current) setLoadError(true);
    } catch {
      if (mountedRef.current) setLoadError(true);
      console.warn("Unable to update admin notifications.");
    }
  };
  const toggle = () => {
    const next = !open; setOpen(next);
    if (next) void mutate("markAllRead");
  };
  const visit = (item: NotificationItem) => { setOpen(false); if (item.href) router.push(item.href); };
  return <div className="notificationCenter"><button className="iconControl notificationTrigger" type="button" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} onClick={toggle}><Bell size={16}/>{unread > 0 && <span>{unread > 9 ? "9+" : unread}</span>}</button>{open && <section className="notificationPopover" role="dialog" aria-label="Administrator notifications"><header><div><p className="adminKicker">INBOX</p><h2>Notifications</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X/></button></header>{loadError && <p className="notificationLoadError" role="status">Unable to load notifications. We&apos;ll retry automatically.</p>}{items.length > 0 && <div className="notificationTools"><button type="button" onClick={() => void mutate("markAllRead")}><CheckCheck/>Mark read</button><button type="button" onClick={() => void mutate("clearAll")}><Trash2/>Clear all</button></div>}<div className="notificationList">{loading ? <div className="notificationEmpty"><span className="queueSpinner"/><b>Loading inbox</b></div> : items.length ? items.map((item) => <article key={item.id} className={item.readAt ? "" : "unread"}><button type="button" className="notificationBody" onClick={() => visit(item)}><span>{item.category.slice(0,1)}</span><div><small>{item.category.toLowerCase()}</small><b>{item.title}</b><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></div></button><button type="button" className="notificationClear" onClick={() => void mutate("clear", item.id)} aria-label={`Clear ${item.title}`}><X/></button></article>) : <div className="notificationEmpty"><Inbox/><b>You&apos;re all caught up</b><p>New feedback and administration changes will appear here.</p></div>}</div></section>}</div>;
}
