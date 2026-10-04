"use client";

import Link from "next/link";

export default function MclError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mcl-route-error"><p>MCL ARCHIVE</p><h1>We could not load this record.</h1><span>Please try again. No tournament data has been changed.</span><div><button type="button" onClick={reset}>Try again</button><Link href="/">Return home</Link></div></main>;
}
