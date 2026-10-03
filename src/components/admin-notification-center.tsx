"use client";

import { useCallback, useEffect, useState } from "react";
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
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as NotificationPayload;
      setItems(data.notifications); setUnread(data.unreadCount);
      onIdentity({ portalName: data.portalName, fullName: data.profile.fullName, role: data.profile.role });
    } finally { setLoading(false); }
  }, [onIdentity]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30_000); return () => window.clearInterval(timer); }, [load]);
  const mutate = async (action: string, id?: string) => {
    const response = await fetch("/api/admin/notifications", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, id }) });
    if (response.ok) await load();
  };
  const toggle = () => {
    const next = !open; setOpen(next);
    if (next) void mutate("markAllRead");
  };
  const visit = (item: NotificationItem) => { setOpen(false); if (item.href) router.push(item.href); };
  return <div className="notificationCenter"><button className="iconControl notificationTrigger" type="button" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} onClick={toggle}><Bell size={16}/>{unread > 0 && <span>{unread > 9 ? "9+" : unread}</span>}</button>{open && <section className="notificationPopover" role="dialog" aria-label="Administrator notifications"><header><div><p className="adminKicker">INBOX</p><h2>Notifications</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close notifications"><X/></button></header>{items.length > 0 && <div className="notificationTools"><button type="button" onClick={() => void mutate("markAllRead")}><CheckCheck/>Mark read</button><button type="button" onClick={() => void mutate("clearAll")}><Trash2/>Clear all</button></div>}<div className="notificationList">{loading ? <div className="notificationEmpty"><span className="queueSpinner"/><b>Loading inbox</b></div> : items.length ? items.map((item) => <article key={item.id} className={item.readAt ? "" : "unread"}><button type="button" className="notificationBody" onClick={() => visit(item)}><span>{item.category.slice(0,1)}</span><div><small>{item.category.toLowerCase()}</small><b>{item.title}</b><p>{item.message}</p><time>{new Date(item.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</time></div></button><button type="button" className="notificationClear" onClick={() => void mutate("clear", item.id)} aria-label={`Clear ${item.title}`}><X/></button></article>) : <div className="notificationEmpty"><Inbox/><b>You&apos;re all caught up</b><p>New feedback and administration changes will appear here.</p></div>}</div></section>}</div>;
}
