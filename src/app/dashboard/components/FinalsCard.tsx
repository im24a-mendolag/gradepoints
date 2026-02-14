"use client";

import { FINALS_SEMESTER } from "@/lib/semesters";
import { useDashboard } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys } from "../utils";

/**
 * Renders a finals subject card (e.g. "German" with Oral + Written rows).
 * Pulls all state and actions from DashboardContext.
 * @param groupName - The base subject name (e.g. "German", "Math").
 * @param entries - The finals entry keys (e.g. ["German (Oral)", "German (Written)"]).
 */
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
    editingGrade,
    startEditingFinals,
    cancelEditingFinals,
  } = useDashboard();

  // Calculate group average
  const groupGrades = entries
    .map((entry) => {
      const g = getGradesForSubject(FINALS_SEMESTER, entry);
      return g.length > 0 ? g[0].value : null;
    })
    .filter((v): v is number => v !== null);
  const groupAvg =
    groupGrades.length > 0
      ? Math.round((groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length) * 2) / 2
      : null;

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      {/* Subject Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{groupName}</h3>
          {groupAvg !== null && (
            <span
              className={`text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-0.5 rounded-full border ${getGradeColor(groupAvg)}`}
            >
              Ø {groupAvg.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Grade rows */}
      <div className="divide-y divide-neutral-800">
        {entries.map((entry) => {
          const existing = getGradesForSubject(FINALS_SEMESTER, entry);
          const currentGrade = existing.length > 0 ? existing[0] : null;
          const label = entry.includes("(Oral)") ? "Oral" : "Written";
          const isEditingThis = editingGrade === `finals-${entry}`;

          return (
            <div
              key={entry}
              className="px-4 sm:px-6 py-3 flex items-center justify-between hover:bg-neutral-800/50 transition"
            >
              {isEditingThis ? (
                /* Edit / Add inline form */
                <div className="flex items-center gap-2 sm:gap-3 flex-1 flex-wrap">
                  <input
                    type="number"
                    min="1"
                    max="6"
                    step="any"
                    value={getFinalsInputValue(entry)}
                    onChange={(e) => onFinalsInputChange(entry, e.target.value)}
                    onKeyDown={(e) => {
                      blockNonNumericKeys(e);
                      if (e.key === "Enter") {
                        const val = getFinalsInputValue(entry);
                        if (val) { saveFinalsGrade(entry, val); cancelEditingFinals(); }
                      }
                    }}
                    className="w-20 sm:w-24 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    placeholder="1–6"
                    autoFocus
                  />
                  <span className="text-sm text-neutral-400">{label}</span>
                  <button
                    onClick={() => {
                      const val = getFinalsInputValue(entry);
                      if (val) { saveFinalsGrade(entry, val); cancelEditingFinals(); }
                    }}
                    disabled={!getFinalsInputValue(entry)}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditingFinals}
                    className="text-sm text-neutral-400 hover:text-neutral-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {currentGrade ? (
                      <span
                        className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm border ${getGradeColor(currentGrade.value)}`}
                      >
                        {currentGrade.value}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm border border-neutral-700 text-neutral-600">
                        —
                      </span>
                    )}
                    <span className="text-sm text-neutral-400">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditingFinals(entry, currentGrade)}
                      className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                      {currentGrade ? "Edit" : "+ Add"}
                    </button>
                    {currentGrade && (
                      <button
                        onClick={() => handleDeleteFinalsEntry(entry)}
                        className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
