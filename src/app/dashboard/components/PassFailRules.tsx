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
            ? "border-green-200"
            : "border-red-200"
          : "border-gray-200"
      }`}
    >
      <div
        className={`px-5 py-3 text-sm font-semibold ${
          status
            ? status.passed
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
            : "bg-gray-50 text-gray-600"
        }`}
      >
        Pass/Fail Rules — Semester {semester}
      </div>
      <div className="bg-white divide-y divide-gray-100">
        {/* Rule 1: Average ≥ 4.0 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule1Pass ? "text-green-500" : "text-red-500") : "text-gray-300"
              }`}
            >
              {status ? (status.rule1Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-sm text-gray-700">Average ≥ 4.0</span>
          </div>
          <span
            className={`text-sm font-medium ${
              status ? (status.rule1Pass ? "text-green-600" : "text-red-600") : "text-gray-400"
            }`}
          >
            {status ? (status.semAvg?.toFixed(2) ?? "—") : "—"}
          </span>
        </div>
        {/* Rule 2: Max 2 subjects below 4.0 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule2Pass ? "text-green-500" : "text-red-500") : "text-gray-300"
              }`}
            >
              {status ? (status.rule2Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-sm text-gray-700">Max 2 subjects below 4.0</span>
          </div>
          <span
            className={`text-sm font-medium ${
              status ? (status.rule2Pass ? "text-green-600" : "text-red-600") : "text-gray-400"
            }`}
          >
            {status ? (
              <>
                {status.subjectsBelow4Count} subject
                {status.subjectsBelow4Count !== 1 ? "s" : ""}
                {status.subjectsBelow4Count > 0 && (
                  <span className="text-gray-400 font-normal">
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
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                status ? (status.rule3Pass ? "text-green-500" : "text-red-500") : "text-gray-300"
              }`}
            >
              {status ? (status.rule3Pass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-sm text-gray-700">Max 2 negative points</span>
          </div>
          <span
            className={`text-sm font-medium ${
              status ? (status.rule3Pass ? "text-green-600" : "text-red-600") : "text-gray-400"
            }`}
          >
            {status ? (
              <>
                {status.negativePoints} point{status.negativePoints !== 1 ? "s" : ""}
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

  if (!status) return null;

  return (
    <div
      className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
        status.passed ? "border-green-200" : "border-red-200"
      }`}
    >
      <div
        className={`px-5 py-3 text-sm font-semibold ${
          status.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
        }`}
      >
        Pass/Fail Rules — 3-Year Final
      </div>
      <div className="bg-white divide-y divide-gray-100">
        {/* Rule 1 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${status.rule1Pass ? "text-green-500" : "text-red-500"}`}>
              {status.rule1Pass ? "✓" : "✗"}
            </span>
            <span className="text-sm text-gray-700">Average ≥ 4.0</span>
          </div>
          <span
            className={`text-sm font-medium ${status.rule1Pass ? "text-green-600" : "text-red-600"}`}
          >
            {status.avg.toFixed(2)}
          </span>
        </div>
        {/* Rule 2 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${status.rule2Pass ? "text-green-500" : "text-red-500"}`}>
              {status.rule2Pass ? "✓" : "✗"}
            </span>
            <span className="text-sm text-gray-700">Max 2 subjects below 4.0</span>
          </div>
          <span
            className={`text-sm font-medium ${status.rule2Pass ? "text-green-600" : "text-red-600"}`}
          >
            {status.subjectsBelow4Count} subject{status.subjectsBelow4Count !== 1 ? "s" : ""}
            {status.subjectsBelow4Count > 0 && (
              <span className="text-gray-400 font-normal">
                {" "}
                ({status.subjectsBelow4.join(", ")})
              </span>
            )}
          </span>
        </div>
        {/* Rule 3 */}
        <div className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${status.rule3Pass ? "text-green-500" : "text-red-500"}`}>
              {status.rule3Pass ? "✓" : "✗"}
            </span>
            <span className="text-sm text-gray-700">Max 2 negative points</span>
          </div>
          <span
            className={`text-sm font-medium ${status.rule3Pass ? "text-green-600" : "text-red-600"}`}
          >
            {status.negativePoints} point{status.negativePoints !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
