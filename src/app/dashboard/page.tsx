"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  SEMESTER_SUBJECTS,
  FINALS_SEMESTER,
  OVERVIEW_TAB,
  OVERVIEW_SUBJECTS,
} from "@/lib/semesters";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import SemesterTabs from "./components/SemesterTabs";
import StatsCards from "./components/StatsCards";
import { SemesterPassFailRules, OverviewPassFailRules } from "./components/PassFailRules";
import SubjectCard from "./components/SubjectCard";
import FinalsCard from "./components/FinalsCard";
import OverviewCard from "./components/OverviewCard";

/**
 * The inner dashboard content that consumes DashboardContext.
 * Handles layout, header, error banner, and tab-based content rendering.
 */
function DashboardContent() {
  const { data: session } = useSession();
  const { activeSemester, error, dismissError, loading } = useDashboard();

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Grade<span className="text-blue-600">Points</span>
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/stats"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              📊 Statistics
            </Link>
            <span className="text-sm text-gray-500">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span>{error}</span>
            <button
              onClick={dismissError}
              className="text-red-400 hover:text-red-600 font-bold text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
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
