"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Something went wrong</h1>
        <p className="text-sm text-fg-muted">{error.message || "An unexpected error occurred."}</p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-control bg-ink text-on-ink text-sm font-medium transition hover:opacity-90 cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
