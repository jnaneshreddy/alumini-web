"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <main className="routeError"><p>Something went wrong</p><h1>We could not load this page.</h1><button onClick={reset}>Try again</button></main>;
}
