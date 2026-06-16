"use client";

import { TOTAL_SEMESTERS, FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";

export default function SemesterTabs() {
  const { activeSemester, selectSemester } = useDashboard();

  return (
    <div className="flex gap-1.5 mb-4 overflow-x-auto sm:overflow-visible scrollbar-none pb-0.5">
      {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).map((sem) => {
        const active = activeSemester === sem;
        return (
          <button
            key={sem}
            onClick={() => selectSemester(sem)}
            className={`flex items-center justify-center px-3 py-1.5 sm:py-3 rounded-lg shrink-0 sm:shrink sm:flex-1 transition cursor-pointer min-w-[46px] sm:min-w-0 ${
              active
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-neutral-900 text-neutral-300 border border-neutral-700 hover:bg-neutral-800"
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
              <span className="sm:hidden">S{sem}</span>
              <span className="hidden sm:inline">Semester {sem}</span>
            </span>
          </button>
        );
      })}
      <button
        onClick={() => selectSemester(FINALS_SEMESTER)}
        className={`flex items-center justify-center px-3 py-1.5 sm:py-3 rounded-lg shrink-0 sm:shrink sm:flex-1 transition cursor-pointer min-w-[52px] sm:min-w-0 ${
          activeSemester === FINALS_SEMESTER
            ? "bg-purple-600 text-white shadow-sm"
            : "bg-neutral-900 text-purple-400 border border-purple-800 hover:bg-purple-900/30"
        }`}
      >
        <span className="text-xs sm:text-sm font-semibold">Finals</span>
      </button>
    </div>
  );
}
