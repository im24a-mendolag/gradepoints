"use client";

import Sidebar from "./Sidebar";
import BottomTabBar from "./BottomTabBar";

const spinner = "animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg";

/** Centered spinner covering the viewport (Suspense fallback). */
export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className={spinner} />
    </div>
  );
}

/** Dashboard chrome (sidebar + bottom tabs) with a spinner while data loads. */
export function LoadingLayout() {
  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 flex items-center justify-center py-20">
        <div className={spinner} />
      </main>
      <BottomTabBar />
    </div>
  );
}
