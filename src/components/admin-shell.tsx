"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Command, LogOut, Menu, Search, Settings, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AdminNotificationCenter } from "@/components/admin-notification-center";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";
import { signOut } from "@/app/admin/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [identity, setIdentity] = useState({ portalName: "MDRS Alumni", fullName: "Administrator", role: "ADMIN" });
  const updateIdentity = useCallback((next: typeof identity) => setIdentity(next), []);
  useEffect(() => {
    if (!navOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", close); };
  }, [navOpen]);
  if (pathname === "/admin/login") return <>{children}</>;
  return <main className="commandCenter">
    <button className={`adminDrawerBackdrop ${navOpen ? "open" : ""}`} type="button" aria-label="Close admin navigation" onClick={() => setNavOpen(false)}/>
    <aside className={`commandSidebar ${navOpen ? "open" : ""}`} aria-label="Administration navigation">
      <div className="commandBrand"><span><Image src="/school-logo-transparent.png" alt="" width={38} height={38} unoptimized/></span><div><b>{identity.portalName}</b><small>ADMINISTRATION</small></div><button className="sidebarClose" type="button" onClick={() => setNavOpen(false)} aria-label="Close admin navigation"><X/></button></div>
      <AdminSidebarNav onNavigate={() => setNavOpen(false)}/>
      <div className="profilePanel"><div className="profileAvatar">{identity.fullName.slice(0,1).toUpperCase()}</div><div><b>{identity.fullName}</b><small>{identity.role.replaceAll("_", " ").toLowerCase()}</small></div></div>
      <form action={signOut} className="sidebarLogout"><button type="submit"><LogOut size={17}/>Sign out</button></form>
    </aside>
    <section className="commandWorkspace">
      <header className="commandTopbar">
        <div className="adminTopbarLead"><button className="iconControl adminMenuButton" type="button" aria-label="Open admin navigation" aria-expanded={navOpen} onClick={() => setNavOpen(true)}><Menu size={18}/></button><div className="commandSearch"><Search size={16}/><span>Search workspace</span><kbd><Command size={11}/>K</kbd></div></div>
        <div className="topbarActions"><AdminNotificationCenter onIdentity={updateIdentity}/><button className="iconControl adminSettingsButton" type="button" aria-label="Open settings" onClick={() => router.push("/admin/settings")}><Settings size={16}/></button><form action={signOut}><button type="submit" className="iconControl adminLogoutButton" aria-label="Sign out" title="Sign out"><LogOut size={16}/></button></form></div>
      </header>
      {children}
    </section>
  </main>;
}
