"use client";

import { FINALS_ENTRIES, IDPA_FINAL_FOR_IDAF } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getGradeColor, getAvgColor } from "../utils";

/**
 * Renders a subject card in the Overview tab, showing the final 3-year grade,
 * semester breakdown, and finals component.
 * @param subject - The subject name (e.g. "Math", "IDAF").
 */
export default function OverviewCard({ subject }: { subject: string }) {
  const { getFinalSubjectGrade, getSemestersForSubject, getSubjectAverage } = useDashboard();

  const { semesterAvg, finalsGrade, finalGrade } = getFinalSubjectGrade(subject);
  const hasFinals = !!FINALS_ENTRIES[subject];
  const hasIdpaFinal = subject === IDPA_FINAL_FOR_IDAF.subject;
  const hasAnyFinal = hasFinals || hasIdpaFinal;
  const finalLabel = hasIdpaFinal ? "IDPA" : "Final";
  const semesters = getSemestersForSubject(subject);

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{subject}</h3>
          {finalGrade !== null && (
            <span
              className={`text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border ${getGradeColor(finalGrade)}`}
            >
              {finalGrade.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-neutral-400 flex-wrap">
          <span>Sem: {semesters.join(", ")}</span>
          <span>
            Avg:{" "}
            {semesterAvg !== null ? (
              <span className={`font-medium ${getAvgColor(semesterAvg)}`}>
                {semesterAvg.toFixed(1)}
              </span>
            ) : (
              <span className="text-neutral-600">—</span>
            )}
          </span>
          {hasAnyFinal && (
            <span>
              {finalLabel}:{" "}
              {finalsGrade !== null ? (
                <span className={`font-medium ${getAvgColor(finalsGrade)}`}>
                  {finalsGrade.toFixed(1)}
                </span>
              ) : (
                <span className="text-neutral-600">—</span>
              )}
            </span>
          )}
        </div>
      </div>
      {/* Semester breakdown */}
      <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex gap-1.5 sm:gap-2 flex-wrap">
        {semesters.map((sem) => {
          const avg = getSubjectAverage(sem, subject);
          return (
            <div key={sem} className="flex flex-col items-center">
              <span className="text-[10px] text-neutral-500 mb-0.5">S{sem}</span>
              <span
                className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold border ${
                  avg !== null ? getGradeColor(avg) : "border-neutral-700 text-neutral-600"
                }`}
              >
                {avg !== null ? avg.toFixed(1) : "—"}
              </span>
            </div>
          );
        })}
        {hasAnyFinal && (
          <div className="flex flex-col items-center">
            <span
              className={`text-[10px] mb-0.5 ${hasIdpaFinal ? "text-amber-400" : "text-purple-400"}`}
            >
              {finalLabel}
            </span>
            <span
              className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs font-bold border ${
                finalsGrade !== null ? getGradeColor(finalsGrade) : "border-neutral-700 text-neutral-600"
              }`}
            >
              {finalsGrade !== null ? finalsGrade.toFixed(1) : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
