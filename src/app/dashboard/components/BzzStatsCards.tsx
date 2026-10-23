"use client";

import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";

function avgColor(v: number | null) {
  return v !== null ? getAvgColor(v) : "text-fg-faint";
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

  const card = "bg-surface border border-line rounded-card px-3.5 py-3";
  const label = "text-[11px] font-semibold tracking-wide uppercase text-fg-faint mb-1";
  const num = "font-mono text-xl";

  return (
    <div className="grid grid-cols-2 xl:grid-cols-2 gap-2.5">
      <div className={card}>
        <p className={label}>Total grades</p>
        <p className={`${num} text-fg`}>{grades.length}</p>
      </div>
      <div className={card}>
        <p className={label}>Normal avg</p>
        <p className={`${num} ${avgColor(normalAvg)}`}>
          {normalAvg !== null ? normalAvg.toFixed(1) : "—"}
          {normalRawAvg !== null && <span className="text-[11px] text-fg-faint ml-1">({normalRawAvg.toFixed(3)})</span>}
        </p>
      </div>
      <div className={card}>
        <p className={label}>ÜK avg</p>
        <p className={`${num} ${avgColor(ukAvg)}`}>
          {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
          {ukRawAvg !== null && <span className="text-[11px] text-fg-faint ml-1">({ukRawAvg.toFixed(3)})</span>}
        </p>
      </div>
      <div className={card}>
        <p className={label}>Final avg</p>
        <p className={`${num} ${avgColor(finalAvg)}`}>{finalAvg !== null ? finalAvg.toFixed(2) : "—"}</p>
      </div>
      <div className={card}>
        <p className={label}>IPA</p>
        <p className={`${num} ${avgColor(ipaGrade)}`}>{ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}</p>
      </div>
      <div className={card}>
        <p className={label}>Status</p>
        <p className={`${num} ${passFail.finalAvg !== null ? (passFail.passed ? "text-subject-green" : "text-now") : "text-fg-faint"}`}>
          {passFail.finalAvg !== null ? (passFail.passed ? "Passed" : "Failed") : "—"}
        </p>
      </div>
    </div>
  );
}
