"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Image,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

const nav = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/carousel", "Carousel photos", Image],
  ["/admin/announcements", "Announcements", Bell],
  ["/admin/events", "Events", CalendarDays],
  ["/admin/users", "Users & access", Users],
  ["/admin/feedback", "Feedback", MessageSquare],
  ["/admin/activity", "Activity log", ScrollText],
  ["/admin/settings", "Settings", Settings],
] as const;

export function AdminSidebarNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav>
      {nav.map(([href, label, Icon]) => {
        const isActive = pathname === href;
        return (
          <button
            type="button"
            key={href}
            onClick={() => router.push(href)}
            className={isActive ? "active" : ""}
          >
            <Icon size={18} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
