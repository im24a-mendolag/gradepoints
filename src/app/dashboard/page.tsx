"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import {
  SEMESTER_SUBJECTS,
  FINALS_SEMESTER,
  FINALS_ENTRIES,
  OVERVIEW_TAB,
  OVERVIEW_SUBJECTS,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "@/lib/semesters";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import Btn from "./components/Btn";
import SemesterTabs from "./components/SemesterTabs";
import StatsCards from "./components/StatsCards";
import { SemesterPassFailRules, OverviewPassFailRules } from "./components/PassFailRules";
import KshSubjectCard from "./components/KshSubjectCard";
import FinalsCard from "./components/FinalsCard";
import OverviewCard from "./components/OverviewCard";
import BzzModuleCard from "./components/BzzModuleCard";
import BzzPassFail from "./components/BzzPassFail";
import AddGradePanel from "./components/AddGradePanel";
import SchoolSelector from "./components/SchoolSelector";
import type { School } from "./types";

/**
 * BZZ-specific stats cards row.
 */
function BzzStatsCards() {
  const { getBzzNormalAverage, getBzzUkAverage, getBzzFinalAverage, getBzzIpaAverage, getBzzPassFail, grades } = useDashboard();
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-3 sm:mb-5">
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 px-3 py-2.5 sm:p-4">
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">Total Grades</p>
        <p className="text-lg sm:text-xl font-bold text-neutral-100">{grades.length}</p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 px-3 py-2.5 sm:p-4">
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">Normal Avg</p>
        <p className={`text-lg sm:text-xl font-bold ${avgColor(normalAvg)}`}>
          {normalAvg !== null ? normalAvg.toFixed(1) : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 px-3 py-2.5 sm:p-4">
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">ÜK Avg</p>
        <p className={`text-lg sm:text-xl font-bold ${avgColor(ukAvg)}`}>
          {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 px-3 py-2.5 sm:p-4">
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">Final Avg</p>
        <p className={`text-lg sm:text-xl font-bold ${avgColor(finalAvg)}`}>
          {finalAvg !== null ? finalAvg.toFixed(2) : "—"}
        </p>
      </div>
      <div
        className={`rounded-xl shadow-sm border px-3 py-2.5 sm:p-4 ${
          ipaGrade !== null
            ? ipaGrade >= 4
              ? "bg-green-900/20 border-green-800"
              : "bg-red-900/20 border-red-800"
            : "bg-neutral-900 border-neutral-800"
        }`}
      >
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">IPA</p>
        <p className={`text-lg sm:text-xl font-bold ${avgColor(ipaGrade)}`}>
          {ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}
        </p>
      </div>
      <div
        className={`rounded-xl shadow-sm border px-3 py-2.5 sm:p-4 ${
          passFail.finalAvg !== null
            ? passFail.passed
              ? "bg-green-900/20 border-green-800"
              : "bg-red-900/20 border-red-800"
            : "bg-neutral-900 border-neutral-800"
        }`}
      >
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">Status</p>
        <p
          className={`text-lg sm:text-xl font-bold ${
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

function BzzCollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
        className="flex items-center gap-2 mb-3 cursor-pointer group"
      >
        <h2 className="text-lg font-semibold text-neutral-100 group-hover:text-neutral-300 transition">
          {title}
        </h2>
        <span
          className={`text-neutral-500 group-hover:text-neutral-300 transition-transform inline-block ${
            open ? "rotate-90" : ""
          }`}
        >
          ▶
        </span>
      </button>
      {open && <div className="space-y-4">{children}</div>}
    </div>
  );
}

/**
 * The inner dashboard content that consumes DashboardContext.
 * Handles layout, header, error banner, and tab-based content rendering.
 */
function DashboardContent() {
  const { data: session } = useSession();
  const { activeSchool, activeSemester, lastRegularSemester, selectSemester, error, dismissError, loading } = useDashboard();

  const [menuOpen, setMenuOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close hamburger menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Lock body scroll when add sheet is open
  useEffect(() => {
    if (addSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [addSheetOpen]);

  const subjects =
    activeSemester === FINALS_SEMESTER ? [] : (SEMESTER_SUBJECTS[activeSemester] ?? []);

  const finalsSubjects = Object.entries(FINALS_ENTRIES).map(([name, entries]) => ({ name, entries }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const canAddGrade = activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB;

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
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            {activeSemester === OVERVIEW_TAB || activeSemester === FINALS_SEMESTER ? (
              <button
                onClick={() => selectSemester(lastRegularSemester)}
                className="text-sm text-neutral-400 hover:text-neutral-200 font-medium transition cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <span className="text-sm text-blue-400 font-medium border-b border-blue-400 pb-0.5">
                Dashboard
              </span>
            )}
            <Link
              href={`/dashboard/stats?school=${activeSchool}`}
              className="text-sm text-neutral-400 hover:text-neutral-200 font-medium transition"
            >
              Statistics
            </Link>
            {activeSchool === "KSH" && (
              <button
                onClick={() => selectSemester(OVERVIEW_TAB)}
                className={`text-sm font-medium transition cursor-pointer ${activeSemester === OVERVIEW_TAB ? "text-amber-400 border-b border-amber-400 pb-0.5" : "text-neutral-400 hover:text-neutral-200"}`}
              >
                Overview
              </button>
            )}
            <div className="w-px h-4 bg-neutral-700" />
            <Link
              href="/dashboard/account"
              className="text-xs text-neutral-500 hover:text-neutral-300 transition"
            >
              {session?.user?.name}
            </Link>
            <Btn size="sm" variant="danger" onClick={() => signOut({ callbackUrl: "/" })}>Sign out</Btn>
          </div>
          {/* Mobile hamburger */}
          <div className="relative sm:hidden" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-neutral-300 hover:bg-neutral-800 text-xl cursor-pointer"
              aria-label="Menu"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-800 border border-neutral-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <Link
                  href={`/dashboard/stats?school=${activeSchool}`}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-blue-400 hover:bg-neutral-700"
                >
                  Statistics
                </Link>
                {activeSchool === "KSH" && (
                  <button
                    onClick={() => { selectSemester(OVERVIEW_TAB); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-amber-400 hover:bg-neutral-700 border-t border-neutral-700 cursor-pointer"
                  >
                    Overview
                  </button>
                )}
                <Link
                  href="/dashboard/account"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-neutral-300 hover:bg-neutral-700 border-t border-neutral-700"
                >
                  {session?.user?.name ?? "Account"}
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-neutral-700 border-t border-neutral-700 cursor-pointer"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-24 sm:pb-8">
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
            {activeSemester !== OVERVIEW_TAB && <SemesterTabs />}

            {/* Add Grade Panel — desktop only */}
            {canAddGrade && (
              <div className="hidden sm:block">
                <AddGradePanel />
              </div>
            )}

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
                  <KshSubjectCard key={subject} subject={subject} />
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

            {/* Add Grade Panel — desktop only */}
            <div className="hidden sm:block">
              <AddGradePanel />
            </div>

            <BzzCollapsibleSection title="Normal Modules" defaultOpen>
              {(BZZ_NORMAL_MODULES as readonly string[]).map((mod) => (
                <BzzModuleCard key={mod} mod={mod} />
              ))}
            </BzzCollapsibleSection>
            <BzzCollapsibleSection title="ÜK Modules" defaultOpen>
              {(BZZ_UK_MODULES as readonly string[]).map((mod) => (
                <BzzModuleCard key={mod} mod={mod} />
              ))}
            </BzzCollapsibleSection>
            <BzzCollapsibleSection title="IPA" defaultOpen>
              <BzzModuleCard mod={BZZ_IPA} />
            </BzzCollapsibleSection>
          </>
        )}
      </main>

      {/* Mobile FAB */}
      {canAddGrade && (
        <button
          onClick={() => setAddSheetOpen(true)}
          className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-light shadow-xl sm:hidden cursor-pointer"
          aria-label="Add grade"
        >
          +
        </button>
      )}

      {/* Mobile Add Grade Bottom Sheet */}
      {addSheetOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 z-40 sm:hidden"
            onClick={() => setAddSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-neutral-900 border-t border-neutral-800 rounded-t-2xl max-h-[88vh] flex flex-col">
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-neutral-700 rounded-full" />
              <span className="text-sm font-semibold text-neutral-100">Add Grade</span>
              <button
                onClick={() => setAddSheetOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-lg cursor-pointer"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {/* Scrollable form */}
            <div className="overflow-y-auto flex-1 px-1 pb-6">
              <AddGradePanel noSlider />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Dashboard page component — wraps the content in DashboardProvider
 * so all children can access shared state via useDashboard().
 */
function DashboardWrapper() {
  const searchParams = useSearchParams();
  const initialSchool: School = searchParams.get("school") === "BZZ" ? "BZZ" : "KSH";
  const tabParam = searchParams.get("tab");
  const tabNum = tabParam !== null ? parseInt(tabParam) : NaN;
  const initialSemester = !isNaN(tabNum) ? tabNum : undefined;
  return (
    <DashboardProvider initialSchool={initialSchool} initialSemester={initialSemester}>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <DashboardWrapper />
    </Suspense>
  );
}
