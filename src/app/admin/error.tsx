"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="adminRouteError" role="alert"><p>ADMIN WORKSPACE</p><h1>Unable to load this workspace.</h1><span>Your data was not changed. Please retry the request.</span><button type="button" onClick={reset}>Try again</button></main>;
}
