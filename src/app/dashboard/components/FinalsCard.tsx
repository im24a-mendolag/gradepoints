"use client";

import { FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys, roundToHalf, subjectColorVar } from "../utils";
import Btn from "./Btn";

export default function FinalsCard({
  groupName,
  entries,
}: {
  groupName: string;
  entries: string[];
}) {
  const {
    getGradesForSubject,
    getFinalsInputValue,
    onFinalsInputChange,
    saveFinalsGrade,
    handleDeleteFinalsEntry,
  } = useDashboard();

  const groupGrades = entries
    .map((entry) => {
      const g = getGradesForSubject(FINALS_SEMESTER, entry);
      return g.length > 0 ? g[0].value : null;
    })
    .filter((v): v is number => v !== null);
  const groupAvg =
    groupGrades.length > 0
      ? roundToHalf(groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length)
      : null;

  return (
    <div className="bg-surface rounded-card border border-line overflow-hidden">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-line">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: subjectColorVar(groupName) }} />
          <h3 className="text-sm sm:text-base font-medium text-fg">{groupName}</h3>
          {groupAvg !== null && (
            <span className={`font-mono text-xs sm:text-sm px-2 sm:px-2.5 py-0.5 rounded-control border ${getGradeColor(groupAvg)}`}>
              Ø {groupAvg.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-line">
        {entries.map((entry) => {
          const existing = getGradesForSubject(FINALS_SEMESTER, entry);
          const currentGrade = existing.length > 0 ? existing[0] : null;
          const label = entry.includes("(Oral)") ? "Oral" : "Written";
          const inputVal = getFinalsInputValue(entry);

          const handleSave = () => {
            if (inputVal) saveFinalsGrade(entry, inputVal);
          };

          return (
            <div key={entry} className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3 hover:bg-hover/40 transition">
              <div className="flex items-center gap-3">
                {currentGrade ? (
                  <span className={`inline-flex items-center justify-center w-9 h-9 rounded-control font-mono text-sm border shrink-0 ${getGradeColor(currentGrade.value)}`}>
                    {currentGrade.value}
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-control font-mono text-sm border border-line text-fg-faint shrink-0">
                    —
                  </span>
                )}
                <span className="text-sm text-fg-muted">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="6"
                  step="any"
                  value={inputVal}
                  onChange={(e) => onFinalsInputChange(entry, e.target.value)}
                  onKeyDown={(e) => {
                    blockNonNumericKeys(e);
                    if (e.key === "Enter") handleSave();
                  }}
                  onBlur={handleSave}
                  className="w-20 px-3 py-1.5 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none text-sm text-fg text-center font-mono"
                  placeholder="1–6"
                />
                {currentGrade && (
                  <Btn size="sm" variant="danger" onClick={() => handleDeleteFinalsEntry(entry)}>Delete</Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
