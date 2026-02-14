"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  SEMESTER_SUBJECTS,
  FINALS_SEMESTER,
  OVERVIEW_TAB,
  OVERVIEW_SUBJECTS,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "@/lib/semesters";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import SemesterTabs from "./components/SemesterTabs";
import StatsCards from "./components/StatsCards";
import { SemesterPassFailRules, OverviewPassFailRules } from "./components/PassFailRules";
import SubjectCard from "./components/SubjectCard";
import FinalsCard from "./components/FinalsCard";
import OverviewCard from "./components/OverviewCard";
import BzzModuleCard from "./components/BzzModuleCard";
import BzzPassFail from "./components/BzzPassFail";
import type { School } from "./types";

/**
 * Pill-style school selector (KSH / BZZ).
 */
function SchoolSelector() {
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

/**
 * BZZ-specific stats cards row.
 */
function BzzStatsCards() {
  const { getBzzNormalAverage, getBzzUkAverage, getBzzFinalAverage, getBzzIpaAverage, getBzzPassFail } = useDashboard();
  const normalAvg = getBzzNormalAverage();
  const ukAvg = getBzzUkAverage();
  const finalAvg = getBzzFinalAverage();
  const ipaGrade = getBzzIpaAverage();
  const passFail = getBzzPassFail();

  const avgColor = (v: number | null) => {
    if (v === null) return "text-neutral-600";
    if (v >= 5.5) return "text-green-400";
    if (v >= 4.5) return "text-blue-400";
    if (v >= 4) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">Normal Avg</p>
        <p className={`text-2xl font-bold ${avgColor(normalAvg)}`}>
          {normalAvg !== null ? normalAvg.toFixed(1) : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">ÜK Avg</p>
        <p className={`text-2xl font-bold ${avgColor(ukAvg)}`}>
          {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">Final Avg</p>
        <p className={`text-2xl font-bold ${avgColor(finalAvg)}`}>
          {finalAvg !== null ? finalAvg.toFixed(2) : "—"}
        </p>
      </div>
      <div
        className={`rounded-xl shadow-sm border p-5 ${
          ipaGrade !== null
            ? ipaGrade >= 4
              ? "bg-green-900/20 border-green-800"
              : "bg-red-900/20 border-red-800"
            : "bg-neutral-900 border-neutral-800"
        }`}
      >
        <p className="text-sm text-neutral-400 mb-1">IPA</p>
        <p className={`text-2xl font-bold ${avgColor(ipaGrade)}`}>
          {ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}
        </p>
      </div>
      <div
        className={`rounded-xl shadow-sm border p-5 ${
          passFail.finalAvg !== null
            ? passFail.passed
              ? "bg-green-900/20 border-green-800"
              : "bg-red-900/20 border-red-800"
            : "bg-neutral-900 border-neutral-800"
        }`}
      >
        <p className="text-sm text-neutral-400 mb-1">Status</p>
        <p
          className={`text-2xl font-bold ${
            passFail.finalAvg !== null
              ? passFail.passed
                ? "text-green-400"
                : "text-red-400"
              : "text-neutral-600"
          }`}
        >
          {passFail.finalAvg !== null ? (passFail.passed ? "✓ Passed" : "✗ Failed") : "—"}
        </p>
      </div>
    </div>
  );
}

/**
 * The inner dashboard content that consumes DashboardContext.
 * Handles layout, header, error banner, and tab-based content rendering.
 */
function DashboardContent() {
  const { data: session } = useSession();
  const { activeSchool, activeSemester, error, dismissError, loading } = useDashboard();

  const subjects =
    activeSemester === FINALS_SEMESTER ? [] : (SEMESTER_SUBJECTS[activeSemester] ?? []);

  const finalsSubjects = [
    { name: "German", entries: ["German (Oral)", "German (Written)"] },
    { name: "French", entries: ["French (Oral)", "French (Written)"] },
    { name: "English", entries: ["English (Oral)", "English (Written)"] },
    { name: "Math", entries: ["Math (Written)"] },
    { name: "WR", entries: ["WR (Written)"] },
    { name: "FrW", entries: ["FrW (Written)"] },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-neutral-100 shrink-0">
              Grade<span className="text-blue-500">Points</span>
            </h1>
            <SchoolSelector />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            <Link
              href="/dashboard/stats"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Statistics
            </Link>
            <span className="text-sm text-neutral-400 hidden sm:inline">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
            <span>{error}</span>
            <button
              onClick={dismissError}
              className="text-red-400 hover:text-red-300 font-bold text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {activeSchool === "KSH" ? (
          <>
            {/* KSH: Stats */}
            <StatsCards />

            {/* Pass/Fail Rules — Semester */}
            {activeSemester > 0 &&
              activeSemester !== FINALS_SEMESTER &&
              activeSemester !== OVERVIEW_TAB && (
                <SemesterPassFailRules semester={activeSemester} />
              )}

            {/* Pass/Fail Rules — Overview */}
            {activeSemester === OVERVIEW_TAB && <OverviewPassFailRules />}

            {/* Semester Tabs */}
            <SemesterTabs />

            {/* Content for active tab */}
            <div className="space-y-4">
              {activeSemester === OVERVIEW_TAB ? (
                <>
                  {OVERVIEW_SUBJECTS.map((subject) => (
                    <OverviewCard key={subject} subject={subject} />
                  ))}
                </>
              ) : activeSemester === FINALS_SEMESTER ? (
                <>
                  {finalsSubjects.map((group) => (
                    <FinalsCard key={group.name} groupName={group.name} entries={group.entries} />
                  ))}
                </>
              ) : (
                subjects.map((subject) => (
                  <SubjectCard key={subject} subject={subject} />
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* BZZ: Stats */}
            <BzzStatsCards />

            {/* BZZ: Pass/Fail */}
            <BzzPassFail />

            {/* Normal Modules */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-3">Normal Modules</h2>
              <div className="space-y-4">
                {(BZZ_NORMAL_MODULES as readonly string[]).map((mod) => (
                  <BzzModuleCard key={mod} mod={mod} />
                ))}
              </div>
            </div>

            {/* ÜK Modules */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-3">ÜK Modules</h2>
              <div className="space-y-4">
                {(BZZ_UK_MODULES as readonly string[]).map((mod) => (
                  <BzzModuleCard key={mod} mod={mod} />
                ))}
              </div>
            </div>

            {/* IPA */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-3">IPA</h2>
              <div className="space-y-4">
                <BzzModuleCard mod={BZZ_IPA} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/**
 * Dashboard page component — wraps the content in DashboardProvider
 * so all children can access shared state via useDashboard().
 */
export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
