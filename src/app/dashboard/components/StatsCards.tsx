"use client";

import { FINALS_SEMESTER, OVERVIEW_TAB } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";

/**
 * Renders the top-level stats cards: semester/finals/overall average, total grades,
 * semester pass/fail status, and 3-year final result.
 * Reads all data from DashboardContext — no props needed.
 */
export default function StatsCards() {
  const {
    activeSemester,
    grades,
    getSemesterAverage,
    getFinalsAverage,
    getOverallAverage,
    getSemesterStatus,
    getOverviewStatus,
  } = useDashboard();

  const semesterAvg =
    activeSemester === FINALS_SEMESTER ? getFinalsAverage() : getSemesterAverage(activeSemester);
  const overallAvg = getOverallAverage();
  const semesterStatus =
    activeSemester > 0 && activeSemester !== FINALS_SEMESTER
      ? getSemesterStatus(activeSemester)
      : null;
  const overviewStatus = activeSemester === OVERVIEW_TAB ? getOverviewStatus() : null;

  const card = "bg-surface border border-line rounded-card px-3.5 py-3";
  const label = "text-[11px] font-semibold tracking-wide uppercase text-fg-faint mb-1";
  const num = "font-mono text-xl";

  return (
    <div className="grid grid-cols-2 xl:grid-cols-2 gap-2.5">
      <div className={card}>
        <p className={label}>
          {activeSemester === FINALS_SEMESTER
            ? "Finals"
            : activeSemester === OVERVIEW_TAB
            ? "Final avg"
            : `Sem ${activeSemester} avg`}
        </p>
        <p
          className={`${num} ${
            activeSemester === OVERVIEW_TAB
              ? overviewStatus ? getAvgColor(overviewStatus.avg) : "text-fg-faint"
              : semesterAvg ? getAvgColor(semesterAvg) : "text-fg-faint"
          }`}
        >
          {activeSemester === OVERVIEW_TAB
            ? overviewStatus ? overviewStatus.avg.toFixed(2) : "—"
            : semesterAvg ? semesterAvg.toFixed(2) : "—"}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Overall avg</p>
        <p className={`${num} ${overallAvg ? getAvgColor(overallAvg) : "text-fg-faint"}`}>
          {overallAvg ? overallAvg.toFixed(2) : "—"}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Total grades</p>
        <p className={`${num} text-fg`}>{grades.length}</p>
      </div>
      {activeSemester > 0 && activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB && (
        <div className={card}>
          <p className={label}>Sem status</p>
          <p className={`${num} ${semesterStatus ? (semesterStatus.passed ? "text-subject-green" : "text-now") : "text-fg-faint"}`}>
            {semesterStatus ? (semesterStatus.passed ? "Passed" : "Failed") : "—"}
          </p>
        </div>
      )}
      {activeSemester === OVERVIEW_TAB && (
        <div className={card}>
          <p className={label}>Final result</p>
          <p className={`${num} ${overviewStatus ? (overviewStatus.passed ? "text-subject-green" : "text-now") : "text-fg-faint"}`}>
            {overviewStatus ? (overviewStatus.passed ? "Passed" : "Failed") : "—"}
          </p>
        </div>
      )}
    </div>
  );
}
