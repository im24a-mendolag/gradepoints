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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Subject Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{groupName}</h3>
          {groupAvg !== null && (
            <span
              className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${getGradeColor(groupAvg)}`}
            >
              Ø {groupAvg.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Grade rows */}
      <div className="divide-y divide-gray-100">
        {entries.map((entry) => {
          const existing = getGradesForSubject(FINALS_SEMESTER, entry);
          const currentGrade = existing.length > 0 ? existing[0] : null;
          const label = entry.includes("(Oral)") ? "Oral" : "Written";
          const isEditingThis = editingGrade === `finals-${entry}`;

          return (
            <div
              key={entry}
              className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition"
            >
              {isEditingThis ? (
                /* Edit / Add inline form */
                <div className="flex items-center gap-3 flex-1">
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
                    className="w-24 px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm text-gray-900"
                    placeholder="1–6"
                    autoFocus
                  />
                  <span className="text-sm text-gray-600">{label}</span>
                  <button
                    onClick={() => {
                      const val = getFinalsInputValue(entry);
                      if (val) { saveFinalsGrade(entry, val); cancelEditingFinals(); }
                    }}
                    disabled={!getFinalsInputValue(entry)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditingFinals}
                    className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-center gap-3">
                    {currentGrade ? (
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border ${getGradeColor(currentGrade.value)}`}
                      >
                        {currentGrade.value}
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border border-gray-200 text-gray-300">
                        —
                      </span>
                    )}
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditingFinals(entry, currentGrade)}
                      className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {currentGrade ? "Edit" : "+ Add Grade"}
                    </button>
                    {currentGrade && (
                      <button
                        onClick={() => handleDeleteFinalsEntry(entry)}
                        className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
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
