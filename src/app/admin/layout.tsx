import "./admin.css";
import "./dashboard-fixes.css";
import "./announcements/announcements.css";
import "./carousel/carousel.css";
import "./events/events.css";
import "./finance/finance.css";
import "./finance/workspace.css";
import "./login/login.css";
import "./users/users.css";
import "./redesign.css";
import { AdminShell } from "@/components/admin-shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
