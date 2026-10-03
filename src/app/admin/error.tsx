"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="adminRouteError"><p>ADMIN WORKSPACE</p><h1>Unable to load this workspace.</h1><button onClick={reset}>Try again</button></main>;
}
