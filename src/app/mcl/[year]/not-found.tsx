import Link from "next/link";

export default function MclSeasonNotFound() {
  return <main className="mcl-route-error"><p>MCL ARCHIVE</p><h1>This season is not published.</h1><span>The requested tournament record may still be a draft or may not exist yet.</span><div><Link href="/mcl">View MCL history</Link><Link href="/">Return home</Link></div></main>;
}
