"use client";

import { Bell, Command, LogOut, Search, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { signOut } from "@/app/admin/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;
  return <main className="commandCenter">
    <aside className="commandSidebar">
      <div className="commandBrand"><span>M</span><div><b>MDRS Alumni</b><small>ADMINISTRATION</small></div></div>
      <AdminSidebarNav />
      <div className="profilePanel"><div className="profileAvatar">A</div><div><b>Administrator</b><small>Secure workspace</small></div></div>
    </aside>
    <section className="commandWorkspace">
      <header className="commandTopbar">
        <div className="commandSearch"><Search size={16}/><span>Search workspace</span><kbd><Command size={11}/>K</kbd></div>
        <div className="topbarActions"><button className="iconControl" type="button" aria-label="Notifications"><Bell size={16}/></button><button className="iconControl" type="button" aria-label="Settings"><Settings size={16}/></button><form action={signOut}><button type="submit" className="iconControl" aria-label="Sign out"><LogOut size={16}/></button></form></div>
      </header>
      {children}
    </section>
  </main>;
}
