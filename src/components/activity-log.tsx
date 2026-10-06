"use client";

import { useState } from "react";
import { getAuditSummary } from "@/lib/audit-summary";
import styles from "./activity-log.module.css";

type ActivityItem = {
  id: string;
  action: string;
  entityType: string;
  oldData: unknown;
  newData: unknown;
  createdAt: string;
  user: { name: string | null; email: string } | null;
};

export function ActivityLog({ items }: { items: ActivityItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  if (!items.length) return <p className={styles.empty}>No activity has been recorded yet.</p>;

  return (
    <div className={styles.list}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <article className={styles.item} key={item.id}>
            <button aria-expanded={isOpen} className={styles.trigger} onClick={() => setOpenId(isOpen ? null : item.id)} type="button">
              <span className={styles.identity}>
                <strong>{item.user?.name || item.user?.email || "System"}</strong>
                <span>{item.entityType.replaceAll("_", " ").toLowerCase()}</span>
              </span>
              <span className={styles.action}>{item.action.replaceAll("_", " ").toLowerCase()}</span>
              <time dateTime={item.createdAt}>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>
              <span aria-hidden="true" className={styles.chevron}>{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? <p className={styles.detail}>{getAuditSummary(item)}</p> : null}
          </article>
        );
      })}
    </div>
  );
}
