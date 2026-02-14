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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">
          {activeSemester === FINALS_SEMESTER
            ? "Finals"
            : activeSemester === OVERVIEW_TAB
            ? "Final Average"
            : `Semester ${activeSemester} Average`}
        </p>
        <p
          className={`text-2xl font-bold ${
            activeSemester === OVERVIEW_TAB
              ? overviewStatus
                ? getAvgColor(overviewStatus.avg)
                : "text-neutral-600"
              : semesterAvg
              ? getAvgColor(semesterAvg)
              : "text-neutral-600"
          }`}
        >
          {activeSemester === OVERVIEW_TAB
            ? overviewStatus
              ? overviewStatus.avg.toFixed(2)
              : "—"
            : semesterAvg
            ? semesterAvg.toFixed(2)
            : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">Overall Average</p>
        <p className={`text-2xl font-bold ${overallAvg ? getAvgColor(overallAvg) : "text-neutral-600"}`}>
          {overallAvg ? overallAvg.toFixed(2) : "—"}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
        <p className="text-sm text-neutral-400 mb-1">Total Grades</p>
        <p className="text-2xl font-bold text-neutral-100">{grades.length}</p>
      </div>
      {activeSemester > 0 && activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB && (
        <div
          className={`rounded-xl shadow-sm border p-5 ${
            semesterStatus
              ? semesterStatus.passed
                ? "bg-green-900/20 border-green-800"
                : "bg-red-900/20 border-red-800"
              : "bg-neutral-900 border-neutral-800"
          }`}
        >
          <p className="text-sm text-neutral-400 mb-1">Semester Status</p>
          <p
            className={`text-2xl font-bold ${
              semesterStatus
                ? semesterStatus.passed
                  ? "text-green-400"
                  : "text-red-400"
                : "text-neutral-600"
            }`}
          >
            {semesterStatus ? (semesterStatus.passed ? "✓ Passed" : "✗ Failed") : "—"}
          </p>
        </div>
      )}
      {activeSemester === OVERVIEW_TAB && (
        <div
          className={`rounded-xl shadow-sm border p-5 ${
            overviewStatus
              ? overviewStatus.passed
                ? "bg-green-900/20 border-green-800"
                : "bg-red-900/20 border-red-800"
              : "bg-neutral-900 border-neutral-800"
          }`}
        >
          <p className="text-sm text-neutral-400 mb-1">Final Result</p>
          <p
            className={`text-2xl font-bold ${
              overviewStatus
                ? overviewStatus.passed
                  ? "text-green-400"
                  : "text-red-400"
                : "text-neutral-600"
            }`}
          >
            {overviewStatus ? (overviewStatus.passed ? "✓ Passed" : "✗ Failed") : "—"}
          </p>
        </div>
      )}
    </div>
  );
}
