"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
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
import SemesterTabs from "./components/SemesterTabs";
import StatsCards from "./components/StatsCards";
import { SemesterPassFailRules, OverviewPassFailRules } from "./components/PassFailRules";
import KshSubjectCard from "./components/KshSubjectCard";
import FinalsCard from "./components/FinalsCard";
import OverviewCard from "./components/OverviewCard";
import BzzModuleCard from "./components/BzzModuleCard";
import BzzPassFail from "./components/BzzPassFail";
import BzzStatsCards from "./components/BzzStatsCards";
import BzzCollapsibleSection from "./components/BzzCollapsibleSection";
import AddGradePanel from "./components/AddGradePanel";
import Sidebar from "./components/Sidebar";
import BottomTabBar from "./components/BottomTabBar";
import SchoolSelector from "./components/SchoolSelector";
import { IconPlus, IconX } from "./components/Icons";
import type { School } from "./types";

/** Stats + pass/fail block — shown in the right rail (xl+) and inline on mobile. */
function RailSection() {
  const { activeSchool, activeSemester } = useDashboard();
  if (activeSchool === "BZZ") {
    return (
      <>
        <BzzStatsCards />
        <BzzPassFail />
      </>
    );
  }
  return (
    <>
      <StatsCards />
      {activeSemester > 0 && activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB && (
        <SemesterPassFailRules semester={activeSemester} />
      )}
      {activeSemester === OVERVIEW_TAB && <OverviewPassFailRules />}
    </>
  );
}

function DashboardContent() {
  const {
    activeSchool,
    activeSemester,
    error,
    dismissError,
    loading,
    isSubmitting,
    undoEntry,
    undoLastAction,
    dismissUndo,
    clearSemesterGrades,
    grades,
  } = useDashboard();

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => setConfirmClear(false), [activeSemester]);

  useEffect(() => {
    if (!addSheetOpen) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [addSheetOpen]);

  const subjects =
    activeSemester === FINALS_SEMESTER ? [] : (SEMESTER_SUBJECTS[activeSemester] ?? []);
  const finalsSubjects = Object.entries(FINALS_ENTRIES).map(([name, entries]) => ({ name, entries }));

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg" />
        </main>
        <BottomTabBar />
      </div>
    );
  }

  const canAddGrade = activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB;

  const title =
    activeSchool === "BZZ"
      ? "Modules"
      : activeSemester === OVERVIEW_TAB
      ? "Overview"
      : activeSemester === FINALS_SEMESTER
      ? "Finals"
      : "Grades";
  const subtitle =
    activeSchool === "BZZ"
      ? `BZZ · ${grades.filter((g) => g.school === "BZZ").length} grades`
      : activeSemester === OVERVIEW_TAB
      ? "Three-year final results"
      : activeSemester === FINALS_SEMESTER
      ? "Oral & written finals"
      : `Semester ${activeSemester} · ${grades.filter((g) => g.semester === activeSemester && g.school !== "BZZ").length} grades`;

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />

      <div className="lg:flex-1 lg:flex min-w-0">
        <main className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
          {/* Header */}
          <header className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
              <p className="text-[11px] text-fg-muted mt-0.5">{subtitle}</p>
            </div>
            <div className="lg:hidden shrink-0">
              <SchoolSelector />
            </div>
          </header>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-card bg-now-tint border border-now/40 text-now text-sm">
              <span>{error}</span>
              <button onClick={dismissError} className="text-now hover:opacity-70 cursor-pointer" aria-label="Dismiss">
                <IconX size={16} />
              </button>
            </div>
          )}

          {/* Inline stats + pass/fail (mobile / below xl) */}
          <div className="xl:hidden flex flex-col gap-4 mb-5">
            <RailSection />
          </div>

          {activeSchool === "KSH" ? (
            <>
              {activeSemester !== OVERVIEW_TAB && (
                <div className="mb-5">
                  <SemesterTabs />
                </div>
              )}

              {canAddGrade && (
                <div className="hidden sm:block mb-5">
                  <AddGradePanel />
                </div>
              )}

              <div className="flex flex-col gap-2.5">
                {activeSemester === OVERVIEW_TAB ? (
                  OVERVIEW_SUBJECTS.map((subject) => <OverviewCard key={subject} subject={subject} />)
                ) : activeSemester === FINALS_SEMESTER ? (
                  finalsSubjects.map((group) => (
                    <FinalsCard key={group.name} groupName={group.name} entries={group.entries} />
                  ))
                ) : (
                  subjects.map((subject) => <KshSubjectCard key={subject} subject={subject} />)
                )}
              </div>

              {canAddGrade && (() => {
                const semGradeCount = grades.filter((g) => g.semester === activeSemester && g.school !== "BZZ").length;
                if (semGradeCount === 0) return null;
                return confirmClear ? (
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-card border border-now/40 bg-now-tint text-sm">
                    <span className="text-now flex-1">Delete all {semGradeCount} grades from semester {activeSemester}?</span>
                    <button
                      onClick={() => { clearSemesterGrades(activeSemester); setConfirmClear(false); }}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-now text-on-solid rounded-control font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 bg-sunken hover:bg-hover text-fg-muted rounded-control transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 flex justify-center">
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="text-xs text-fg-faint hover:text-now transition cursor-pointer"
                    >
                      Remove all grades from this semester
                    </button>
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              {canAddGrade && (
                <div className="hidden sm:block mb-5">
                  <AddGradePanel />
                </div>
              )}
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

        {/* Right rail (xl+) */}
        <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 border-l border-line px-6 py-7 sticky top-0 self-start h-screen overflow-y-auto">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-fg-faint">
            {activeSchool === "BZZ" ? "Overview" : "This semester"}
          </p>
          <RailSection />
        </aside>
      </div>

      <BottomTabBar />

      {/* Mobile FAB */}
      {canAddGrade && (
        <button
          onClick={() => setAddSheetOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 w-13 h-13 bg-ink text-on-ink rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{ width: 52, height: 52 }}
          aria-label="Add grade"
        >
          <IconPlus size={22} />
        </button>
      )}

      {/* Mobile Add Grade Bottom Sheet */}
      {addSheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setAddSheetOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-surface border-t border-line rounded-t-card max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0 relative">
              <div className="absolute left-1/2 -translate-x-1/2 top-2 w-10 h-1 bg-line-strong rounded-full" />
              <span className="text-sm font-semibold text-fg">Add Grade</span>
              <button
                onClick={() => setAddSheetOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-sunken text-fg-muted hover:text-fg cursor-pointer"
                aria-label="Close"
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-1 pb-6">
              <AddGradePanel noSlider />
            </div>
          </div>
        </>
      )}

      {/* Undo toast */}
      {undoEntry && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-surface border border-line rounded-card shadow-lg text-sm text-fg whitespace-nowrap">
          <span>{undoEntry.label}</span>
          <button
            onClick={undoLastAction}
            disabled={isSubmitting}
            className="font-semibold text-fg hover:opacity-70 transition cursor-pointer disabled:opacity-50"
          >
            Undo
          </button>
          <button onClick={dismissUndo} className="text-fg-faint hover:text-fg transition cursor-pointer" aria-label="Dismiss">
            <IconX size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function DashboardWrapper() {
  const searchParams = useSearchParams();
  const initialSchool: School = searchParams.get("school") === "BZZ" ? "BZZ" : "KSH";
  const tabNum = parseInt(searchParams.get("tab") ?? "");
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
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg" />
      </div>
    }>
      <DashboardWrapper />
    </Suspense>
  );
}
