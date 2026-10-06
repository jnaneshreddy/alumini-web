import "./admin.css";
import "./dashboard-fixes.css";
import "./announcements/announcements.css";
import "./carousel/carousel.css";
import "./events/events.css";
import "./finance/finance.css";
import "./finance/workspace.css";
import "./login/login.css";
import "./users/users.css";
import "./users/management.css";
import "./gallery/gallery.css";
import "./teachers/teachers.css";
import "./mcl/mcl.css";
import "./redesign.css";
import "./contrast-fixes.css";
import "./workspaces.css";
import "./responsive.css";
import "./security-responsive.css";
import { AdminShell } from "@/components/admin-shell";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
