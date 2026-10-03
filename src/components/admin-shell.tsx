"use client";

import { useCallback, useState } from "react";
import { Command, LogOut, Search, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AdminNotificationCenter } from "@/components/admin-notification-center";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { signOut } from "@/app/admin/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState({ portalName: "MDRS Alumni", fullName: "Administrator", role: "ADMIN" });
  const updateIdentity = useCallback((next: typeof identity) => setIdentity(next), []);
  if (pathname === "/admin/login") return <>{children}</>;
  return <main className="commandCenter">
    <aside className="commandSidebar">
      <div className="commandBrand"><span>{identity.portalName.slice(0,1).toUpperCase()}</span><div><b>{identity.portalName}</b><small>ADMINISTRATION</small></div></div>
      <AdminSidebarNav />
      <div className="profilePanel"><div className="profileAvatar">{identity.fullName.slice(0,1).toUpperCase()}</div><div><b>{identity.fullName}</b><small>{identity.role.replaceAll("_", " ").toLowerCase()}</small></div></div>
    </aside>
    <section className="commandWorkspace">
      <header className="commandTopbar">
        <div className="commandSearch"><Search size={16}/><span>Search workspace</span><kbd><Command size={11}/>K</kbd></div>
        <div className="topbarActions"><AdminNotificationCenter onIdentity={updateIdentity}/><button className="iconControl" type="button" aria-label="Open settings" onClick={() => router.push("/admin/settings")}><Settings size={16}/></button><form action={signOut}><button type="submit" className="iconControl" aria-label="Sign out"><LogOut size={16}/></button></form></div>
      </header>
      {children}
    </section>
  </main>;
}
