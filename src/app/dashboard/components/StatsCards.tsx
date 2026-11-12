"use client";

import type { ReactNode } from "react";
import { FINALS_SEMESTER, OVERVIEW_TAB } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";

const avgColor = (v: number | null) => (v !== null ? getAvgColor(v) : "text-fg-faint");
const fmt = (v: number | null, digits: number) => (v !== null ? v.toFixed(digits) : "—");

export function StatTile({ label, children, color = "text-fg" }: { label: string; children: ReactNode; color?: string }) {
  return (
    <div className="bg-surface border border-line rounded-card px-3.5 py-3">
      <p className="text-[11px] font-semibold tracking-wide uppercase text-fg-faint mb-1">{label}</p>
      <p className={`font-mono text-xl ${color}`}>{children}</p>
    </div>
  );
}

/** Average tile: value rounded to `digits`, colored by grade, "—" when missing. */
export function AvgTile({ label, value, digits, extra }: { label: string; value: number | null; digits: number; extra?: ReactNode }) {
  return (
    <StatTile label={label} color={avgColor(value)}>
      {fmt(value, digits)}
      {extra}
    </StatTile>
  );
}

/** Passed / Failed tile; "—" while undecided (`passed` null). */
export function ResultTile({ label, passed }: { label: string; passed: boolean | null }) {
  if (passed === null) return <StatTile label={label} color="text-fg-faint">—</StatTile>;
  return (
    <StatTile label={label} color={passed ? "text-subject-green" : "text-now"}>
      {passed ? "Passed" : "Failed"}
    </StatTile>
  );
}

export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 xl:grid-cols-2 gap-2.5">{children}</div>;
}

function primaryLabel(activeSemester: number) {
  if (activeSemester === FINALS_SEMESTER) return "Finals";
  if (activeSemester === OVERVIEW_TAB) return "Final avg";
  return `Sem ${activeSemester} avg`;
}

/** The pass/fail tile for the active tab: semester status, 3-year result, or none (finals). */
function StatusTile({ activeSemester }: { activeSemester: number }) {
  const { getSemesterStatus, getOverviewStatus } = useDashboard();
  if (activeSemester === OVERVIEW_TAB) {
    return <ResultTile label="Final result" passed={getOverviewStatus()?.passed ?? null} />;
  }
  if (activeSemester === FINALS_SEMESTER) return null;
  return <ResultTile label="Sem status" passed={getSemesterStatus(activeSemester)?.passed ?? null} />;
}

/**
 * Renders the top-level stats cards: semester/finals/overall average, total grades,
 * semester pass/fail status, and 3-year final result.
 * Reads all data from DashboardContext — no props needed.
 */
export default function StatsCards() {
  const { activeSemester, grades, getSemesterAverage, getFinalsAverage, getOverallAverage, getOverviewStatus } =
    useDashboard();

  const primaryAvg =
    activeSemester === OVERVIEW_TAB ? getOverviewStatus()?.avg ?? null
    : activeSemester === FINALS_SEMESTER ? getFinalsAverage()
    : getSemesterAverage(activeSemester);

  return (
    <StatTiles>
      <AvgTile label={primaryLabel(activeSemester)} value={primaryAvg} digits={2} />
      <AvgTile label="Overall avg" value={getOverallAverage()} digits={2} />
      <StatTile label="Total grades">{grades.length}</StatTile>
      <StatusTile activeSemester={activeSemester} />
    </StatTiles>
  );
}
