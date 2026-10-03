"use client";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Image,
  Images,
  LayoutDashboard,
  MessageSquare,
  ScrollText,
  Settings,
  GraduationCap,
  Users,
} from "lucide-react";

const nav = [
  ["/admin", "Dashboard", LayoutDashboard],
  ["/admin/users", "Users & access", Users],
  ["/admin/alumni", "Alumni", Users],
  ["/admin/teachers", "Teachers", GraduationCap],
  ["/admin/events", "Events", CalendarDays],
  ["/admin/announcements", "Announcements", Bell],
  ["/admin/gallery", "Photo gallery", Images],
  ["/admin/memories", "Memories", Image],
  ["/admin/carousel", "Hero carousel", Image],
  ["/admin/feedback", "Feedback", MessageSquare],
  ["/admin/activity", "Activity log", ScrollText],
  ["/admin/settings", "Settings", Settings],
] as const;

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
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
            onClick={() => { onNavigate?.(); router.push(href); }}
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
