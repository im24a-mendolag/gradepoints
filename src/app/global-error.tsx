"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-neutral-400">{error.message || "A critical error occurred."}</p>
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
