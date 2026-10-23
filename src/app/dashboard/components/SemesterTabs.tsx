"use client";

import { TOTAL_SEMESTERS, FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";

export default function SemesterTabs() {
  const { activeSemester, selectSemester } = useDashboard();

  const pill = (active: boolean) =>
    `flex items-center justify-center px-3.5 py-1.5 rounded-control shrink-0 text-sm font-medium transition cursor-pointer ${
      active
        ? "bg-surface text-fg shadow-sm"
        : "text-fg-muted hover:text-fg"
    }`;

  return (
    <div className="flex gap-0.5 overflow-x-auto sm:overflow-visible scrollbar-none rounded-card bg-sunken p-0.5">
      {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).map((sem) => (
        <button key={sem} onClick={() => selectSemester(sem)} className={`${pill(activeSemester === sem)} sm:flex-1`}>
          <span className="whitespace-nowrap">
            <span className="sm:hidden">S{sem}</span>
            <span className="hidden sm:inline">Semester {sem}</span>
          </span>
        </button>
      ))}
      <button
        onClick={() => selectSemester(FINALS_SEMESTER)}
        className={`${pill(activeSemester === FINALS_SEMESTER)} sm:flex-1`}
      >
        <span className="sm:hidden">F</span>
        <span className="hidden sm:inline">Finals</span>
      </button>
    </div>
  );
}
