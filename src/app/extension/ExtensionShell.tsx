"use client";

import type { ReactNode } from "react";
import { DashboardProvider } from "../dashboard/DashboardContext";
import Sidebar from "../dashboard/components/Sidebar";
import BottomTabBar from "../dashboard/components/BottomTabBar";

/** Wraps static page content in the app shell (sidebar + bottom tab bar). */
export default function ExtensionShell({ children }: { children: ReactNode }) {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-canvas lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
          {children}
        </main>
        <BottomTabBar />
      </div>
    </DashboardProvider>
  );
}
