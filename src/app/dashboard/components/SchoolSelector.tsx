"use client";

import { useDashboard } from "../DashboardContext";
import type { School } from "../types";

export default function SchoolSelector() {
  const { activeSchool, setActiveSchool } = useDashboard();
  const schools: School[] = ["KSH", "BZZ"];

  return (
    <div className="inline-flex rounded-lg bg-neutral-800 p-0.5">
      {schools.map((s) => (
        <button
          key={s}
          onClick={() => setActiveSchool(s)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
            activeSchool === s
              ? "bg-blue-600 text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
