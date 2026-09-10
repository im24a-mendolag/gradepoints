"use client";

import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";

function avgColor(v: number | null) {
  return v !== null ? getAvgColor(v) : "text-neutral-600";
}

export default function BzzStatsCards() {
  const { getBzzNormalAverage, getBzzNormalRawAverage, getBzzUkAverage, getBzzUkRawAverage, getBzzFinalAverage, getBzzIpaAverage, getBzzPassFail, grades } = useDashboard();
  const normalAvg = getBzzNormalAverage();
  const normalRawAvg = getBzzNormalRawAverage();
  const ukAvg = getBzzUkAverage();
  const ukRawAvg = getBzzUkRawAverage();
  const finalAvg = getBzzFinalAverage();
  const ipaGrade = getBzzIpaAverage();
  const passFail = getBzzPassFail();

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
          {normalRawAvg !== null && <span className="text-xs text-neutral-400 font-normal ml-1">({normalRawAvg.toFixed(3)})</span>}
        </p>
      </div>
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 px-3 py-2.5 sm:p-4">
        <p className="text-[10px] sm:text-xs text-neutral-400 mb-0.5">ÜK Avg</p>
        <p className={`text-lg sm:text-xl font-bold ${avgColor(ukAvg)}`}>
          {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
          {ukRawAvg !== null && <span className="text-xs text-neutral-400 font-normal ml-1">({ukRawAvg.toFixed(3)})</span>}
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
