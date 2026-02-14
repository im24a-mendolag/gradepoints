"use client";

import { TOTAL_SEMESTERS, FINALS_SEMESTER, OVERVIEW_TAB } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";

/**
 * Renders the navigation tabs for semesters (1–6), finals, and overview.
 * Reads activeSemester and computation functions from DashboardContext — no props needed.
 */
export default function SemesterTabs() {
  const { activeSemester, selectSemester, getSemesterAverage } = useDashboard();

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).map((sem) => {
        const avg = getSemesterAverage(sem);
        return (
          <button
            key={sem}
            onClick={() => selectSemester(sem)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              activeSemester === sem
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800"
            }`}
          >
            Sem {sem}
            {avg !== null && (
              <span className={`ml-1.5 ${activeSemester === sem ? "text-blue-200" : "text-neutral-500"}`}>
                {avg.toFixed(1)}
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={() => selectSemester(FINALS_SEMESTER)}
        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
          activeSemester === FINALS_SEMESTER
            ? "bg-purple-600 text-white shadow-sm"
            : "bg-neutral-900 text-purple-400 border border-purple-800 hover:bg-purple-900/30"
        }`}
      >
        Finals
      </button>
      <button
        onClick={() => selectSemester(OVERVIEW_TAB)}
        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
          activeSemester === OVERVIEW_TAB
            ? "bg-amber-600 text-white shadow-sm"
            : "bg-neutral-900 text-amber-400 border border-amber-800 hover:bg-amber-900/30"
        }`}
      >
        Overview
      </button>
    </div>
  );
}
