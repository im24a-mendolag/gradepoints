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
    <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
      {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).map((sem) => {
        const avg = getSemesterAverage(sem);
        return (
          <button
            key={sem}
            onClick={() => selectSemester(sem)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              activeSemester === sem
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Semester {sem}
            {avg !== null && (
              <span className={`ml-2 ${activeSemester === sem ? "text-blue-200" : "text-gray-400"}`}>
                {avg.toFixed(1)}
              </span>
            )}
          </button>
        );
      })}
      <button
        onClick={() => selectSemester(FINALS_SEMESTER)}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
          activeSemester === FINALS_SEMESTER
            ? "bg-purple-600 text-white shadow-sm"
            : "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50"
        }`}
      >
        Finals
      </button>
      <button
        onClick={() => selectSemester(OVERVIEW_TAB)}
        className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
          activeSemester === OVERVIEW_TAB
            ? "bg-amber-600 text-white shadow-sm"
            : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-50"
        }`}
      >
        Overview
      </button>
    </div>
  );
}
