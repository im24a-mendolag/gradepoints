"use client";

import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";

/**
 * Renders the BZZ pass/fail summary showing:
 * - Normal Modules Average (rounded 0.5)
 * - ÜK Modules Average (rounded 0.5)
 * - Final Average (unrounded)
 * - IPA Grade (unrounded)
 * Pass condition: finalAvg >= 4 AND ipaGrade >= 4
 */
export default function BzzPassFail() {
  const { getBzzPassFail } = useDashboard();
  const status = getBzzPassFail();
  const { normalAvg, ukAvg, finalAvg, ipaGrade, ipaPass, passed } = status;

  const hasData = normalAvg !== null || ukAvg !== null || ipaGrade !== null;
  const avgPass = finalAvg !== null ? finalAvg >= 4 : null;

  return (
    <div
      className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
        hasData
          ? passed
            ? "border-green-800"
            : "border-red-800"
          : "border-neutral-800"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 sm:px-5 py-3 text-sm font-semibold ${
          hasData
            ? passed
              ? "bg-green-900/30 text-green-300"
              : "bg-red-900/30 text-red-300"
            : "bg-neutral-900 text-neutral-400"
        }`}
      >
        Pass/Fail — BZZ
      </div>

      <div className="bg-neutral-900 divide-y divide-neutral-800">
        {/* Normal Modules Average */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm text-neutral-300">Normal Modules Avg</span>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              normalAvg !== null ? getAvgColor(normalAvg) : "text-neutral-600"
            }`}
          >
            {normalAvg !== null ? normalAvg.toFixed(1) : "—"}
          </span>
        </div>

        {/* ÜK Modules Average */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm text-neutral-300">ÜK Modules Avg</span>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              ukAvg !== null ? getAvgColor(ukAvg) : "text-neutral-600"
            }`}
          >
            {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
          </span>
        </div>

        {/* Final Average (avg of normal + ÜK, unrounded) */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                avgPass !== null
                  ? avgPass
                    ? "text-green-400"
                    : "text-red-400"
                  : "text-neutral-600"
              }`}
            >
              {avgPass !== null ? (avgPass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">Final Average ≥ 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              finalAvg !== null
                ? finalAvg >= 4
                  ? "text-green-400"
                  : "text-red-400"
                : "text-neutral-600"
            }`}
          >
            {finalAvg !== null ? finalAvg.toFixed(2) : "—"}
          </span>
        </div>

        {/* IPA Grade (unrounded) */}
        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-lg ${
                ipaPass !== null
                  ? ipaPass
                    ? "text-green-400"
                    : "text-red-400"
                  : "text-neutral-600"
              }`}
            >
              {ipaPass !== null ? (ipaPass ? "✓" : "✗") : "—"}
            </span>
            <span className="text-xs sm:text-sm text-neutral-300">IPA ≥ 4.0</span>
          </div>
          <span
            className={`text-xs sm:text-sm font-medium shrink-0 ${
              ipaGrade !== null
                ? ipaGrade >= 4
                  ? "text-green-400"
                  : "text-red-400"
                : "text-neutral-600"
            }`}
          >
            {ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
