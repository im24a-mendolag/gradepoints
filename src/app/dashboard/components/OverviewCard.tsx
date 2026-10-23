"use client";

import { FINALS_ENTRIES, IDPA_FINAL_FOR_IDAF, KSH_SUBJECT_NAMES } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getGradeColor, getAvgColor, subjectColorVar } from "../utils";

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
    <div className="bg-surface rounded-card border border-line overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: subjectColorVar(subject) }} />
          <div>
            <h3 className="text-sm sm:text-base font-medium text-fg">{subject}</h3>
            {KSH_SUBJECT_NAMES[subject] && (
              <p className="text-[11px] text-fg-faint">{KSH_SUBJECT_NAMES[subject]}</p>
            )}
          </div>
          {finalGrade !== null && (
            <span className={`font-mono text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-control border ${getGradeColor(finalGrade)}`}>
              {finalGrade.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] text-fg-muted flex-wrap">
          <span>Sem: {semesters.join(", ")}</span>
          <span>
            Avg:{" "}
            {semesterAvg !== null ? (
              <span className={`font-mono ${getAvgColor(semesterAvg)}`}>{semesterAvg.toFixed(1)}</span>
            ) : (
              <span className="text-fg-faint">—</span>
            )}
          </span>
          {hasAnyFinal && (
            <span>
              {finalLabel}:{" "}
              {finalsGrade !== null ? (
                <span className={`font-mono ${getAvgColor(finalsGrade)}`}>{finalsGrade.toFixed(1)}</span>
              ) : (
                <span className="text-fg-faint">—</span>
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
              <span className="text-[10px] text-fg-faint mb-0.5 font-mono">S{sem}</span>
              <span className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-control text-xs font-mono border ${avg !== null ? getGradeColor(avg) : "border-line text-fg-faint"}`}>
                {avg !== null ? avg.toFixed(1) : "—"}
              </span>
            </div>
          );
        })}
        {hasAnyFinal && (
          <div className="flex flex-col items-center">
            <span className={`text-[10px] mb-0.5 ${hasIdpaFinal ? "text-subject-amber" : "text-subject-violet"}`}>{finalLabel}</span>
            <span className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-control text-xs font-mono border ${finalsGrade !== null ? getGradeColor(finalsGrade) : "border-line text-fg-faint"}`}>
              {finalsGrade !== null ? finalsGrade.toFixed(1) : "—"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
