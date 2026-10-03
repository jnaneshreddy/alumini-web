import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";

const links = [["/our-story","Our Story"],["/alumni","Alumni"],["/batches","Batches"],["/memories","Memories"],["/events","Events"],["/stories","Stories"],["/notices","Notices"]];

export function PublicHeader() {
  return <header className="public-header"><Link href="/" className="institution-mark" aria-label="MDRS Alumni home"><span>M</span><div><b>Morarji Desai</b><small>Residential School Alumni</small></div></Link><nav aria-label="Primary navigation">{links.map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</nav><div className="header-actions"><Link href="/admin/login">Login</Link><button type="button" aria-label="Open navigation"><Menu size={20}/></button></div></header>;
}

export function PublicFooter() {
  return <footer className="public-footer"><div><p className="footer-kicker">MDRS · Established 1997</p><h2>A shared place.<br/>A lifelong connection.</h2></div><div><h3>Explore</h3>{links.slice(0,5).map(([href,label]) => <Link key={href} href={href}>{label}</Link>)}</div><div><h3>Institution</h3><p>Doddabadagere<br/>Harohalli Hobli<br/>Kanakapura Taluk<br/>Ramanagara District<br/>Karnataka, India</p></div><div className="footer-bottom"><span>© 2026 Morarji Desai Residential School Alumni</span><Link href="/feedback">Share feedback <ArrowUpRight size={14}/></Link></div></footer>;
}
