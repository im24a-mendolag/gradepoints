"use client";

import { useDashboard } from "../DashboardContext";

/**
 * Renders the pass/fail rules breakdown for a regular semester.
 * @param semester - The semester number (1–6) to display rules for.
 */
export function SemesterPassFailRules({ semester }: { semester: number }) {
  const { getSemesterStatus } = useDashboard();
  const status = getSemesterStatus(semester);

  return (
    <div
      className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
        status
          ? status.passed
            ? "border-green-800"
            : "border-red-800"
          : "border-neutral-800"
      }`}
    >
      <div
        className={`px-4 sm:px-5 py-3 text-sm font-semibold ${
          status
            ? status.passed
              ? "bg-green-900/30 text-green-300"
              : "bg-red-900/30 text-red-300"
            : "bg-neutral-900 text-neutral-400"
        }`}
      >
        Pass/Fail Rules — Semester {semester}
      </div>
      <div className="bg-neutral-900 divide-y divide-neutral-800">
        {/* Rule 1: Average ≥ 4.0 */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule1Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule1Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Average ≥ 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              status ? (status.rule1Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? (status.semAvg?.toFixed(2) ?? "—") : "—"}
          </span>
        </div>
        {/* Rule 2: Max 2 subjects below 4.0 */}
        <div className="px-4 sm:px-5 py-3 flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule2Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule2Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Max 2 below 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium text-right ${
              status ? (status.rule2Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? (
              <>
                {status.subjectsBelow4Count} subject
                {status.subjectsBelow4Count !== 1 ? "s" : ""}
                {status.subjectsBelow4Count > 0 && (
                  <span className="text-neutral-500 font-normal block sm:inline">
                    {" "}
                    ({status.subjectsBelow4.join(", ")})
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
        {/* Rule 3: Max 2 negative points */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule3Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule3Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Max 2 neg. points</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              status ? (status.rule3Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? (
              <>
                {status.negativePoints} pt{status.negativePoints !== 1 ? "s" : ""}
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the pass/fail rules breakdown for the 3-year overview.
 * Reads OverviewStatus from DashboardContext.
 */
export function OverviewPassFailRules() {
  const { getOverviewStatus } = useDashboard();
  const status = getOverviewStatus();

  return (
    <div
      className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
        status
          ? status.passed
            ? "border-green-800"
            : "border-red-800"
          : "border-neutral-800"
      }`}
    >
      <div
        className={`px-4 sm:px-5 py-3 text-sm font-semibold ${
          status
            ? status.passed
              ? "bg-green-900/30 text-green-300"
              : "bg-red-900/30 text-red-300"
            : "bg-neutral-900 text-neutral-400"
        }`}
      >
        Pass/Fail Rules — 3-Year Final
      </div>
      <div className="bg-neutral-900 divide-y divide-neutral-800">
        {/* Rule 1 */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule1Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule1Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Average ≥ 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              status ? (status.rule1Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? status.avg.toFixed(2) : "—"}
          </span>
        </div>
        {/* Rule 2 */}
        <div className="px-4 sm:px-5 py-3 flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule2Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule2Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Max 2 below 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium text-right ${
              status ? (status.rule2Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? (
              <>
                {status.subjectsBelow4Count} subject{status.subjectsBelow4Count !== 1 ? "s" : ""}
                {status.subjectsBelow4Count > 0 && (
                  <span className="text-neutral-500 font-normal block sm:inline">
                    {" "}
                    ({status.subjectsBelow4.join(", ")})
                  </span>
                )}
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
        {/* Rule 3 */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule3Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
              }`}
            >
              {status ? (status.rule3Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Max 2 neg. points</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              status ? (status.rule3Pass ? "text-green-400" : "text-red-400") : "text-neutral-600"
            }`}
          >
            {status ? (
              <>
                {status.negativePoints} pt{status.negativePoints !== 1 ? "s" : ""}
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
