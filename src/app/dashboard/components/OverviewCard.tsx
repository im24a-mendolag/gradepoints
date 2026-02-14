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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{subject}</h3>
          {finalGrade !== null && (
            <span
              className={`text-sm font-bold px-3 py-1 rounded-full border ${getGradeColor(finalGrade)}`}
            >
              {finalGrade.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Semesters: {semesters.join(", ")}</span>
          <span>
            Sem. Avg:{" "}
            {semesterAvg !== null ? (
              <span className={`font-medium ${getAvgColor(semesterAvg)}`}>
                {semesterAvg.toFixed(1)}
              </span>
            ) : (
              <span className="text-gray-400">—</span>
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
                <span className="text-gray-400">—</span>
              )}
            </span>
          )}
        </div>
      </div>
      {/* Semester breakdown */}
      <div className="px-6 pb-4 flex gap-2 flex-wrap">
        {semesters.map((sem) => {
          const avg = getSubjectAverage(sem, subject);
          return (
            <div key={sem} className="flex flex-col items-center">
              <span className="text-[10px] text-gray-400 mb-0.5">S{sem}</span>
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold border ${
                  avg !== null ? getGradeColor(avg) : "border-gray-200 text-gray-300"
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
              className={`text-[10px] mb-0.5 ${hasIdpaFinal ? "text-amber-500" : "text-purple-400"}`}
            >
              {finalLabel}
            </span>
            <span
              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold border ${
                finalsGrade !== null ? getGradeColor(finalsGrade) : "border-gray-200 text-gray-300"
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
