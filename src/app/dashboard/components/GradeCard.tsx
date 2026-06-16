"use client";

import { useDashboard } from "../DashboardContext";
import { getGradeColor, formatWeight } from "../utils";
import type { Grade } from "../types";
import Btn from "./Btn";
import { GradePicker, WeightPicker } from "./GradePickers";

interface GradeCardProps {
  title: string;
  subtitle?: string;
  expandKey: string;
  grades: Grade[];
  avg: number | null;
  rawAvg: number | null;
  adj: number;
}

export default function GradeCard({ title, subtitle, expandKey, grades, avg, rawAvg, adj }: GradeCardProps) {
  const {
    expandedSubjects,
    toggleExpand,
    editingGrade,
    startEditing,
    cancelEditing,
    editValue, setEditValue,
    editWeight, setEditWeight,
    editDescription, setEditDescription,
    editDate, setEditDate,
    updateGrade,
    deleteGrade,
    isSubmitting,
  } = useDashboard();

  const isExpanded = expandedSubjects.has(expandKey);

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => toggleExpand(expandKey)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Hide grades for ${title}` : `Show grades for ${title}`}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition shrink-0"
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
          </button>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-neutral-100">{title}</h3>
            {subtitle && <p className="text-xs text-neutral-500 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {adj !== 0 && (
            <span className={`text-sm font-medium px-2 py-1 rounded border shrink-0 ${adj > 0 ? "text-green-400 bg-green-900/30 border-green-700" : "text-red-400 bg-red-900/30 border-red-700"}`}>
              {adj > 0 ? "+" : ""}{adj}
            </span>
          )}
          <span className="text-sm text-neutral-400">
            {grades.length} grade{grades.length !== 1 ? "s" : ""}
          </span>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full border ${avg !== null ? getGradeColor(avg) : "text-neutral-500 border-neutral-700"}`}>
            {avg !== null ? (
              <>
                Ø {avg.toFixed(1)}
                {rawAvg !== null && (
                  <span className="text-neutral-500 font-normal ml-1 text-xs">({rawAvg.toFixed(3)})</span>
                )}
              </>
            ) : "—"}
          </span>
        </div>
      </div>

      {isExpanded &&
        (grades.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {grades.map((grade) => (
              <div key={grade.id} className="px-4 sm:px-5 py-3 hover:bg-neutral-800/50 transition">
                {editingGrade === grade.id ? (
                  <div className="space-y-3 py-1">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Grade</label>
                      <GradePicker value={editValue} onChange={setEditValue} noSlider />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Weight</label>
                      <WeightPicker value={editWeight} onChange={setEditWeight} noSlider />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                        placeholder="Description"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Btn size="sm" variant="primary" disabled={isSubmitting} onClick={() => updateGrade(grade.id)}>
                        {isSubmitting ? "Saving…" : "Save"}
                      </Btn>
                      <Btn size="sm" disabled={isSubmitting} onClick={cancelEditing}>Cancel</Btn>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg font-bold text-sm border shrink-0 ${getGradeColor(grade.value)}`}>
                        {grade.value}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium shrink-0">×{formatWeight(grade.weight)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-200 truncate">{grade.description || "No description"}</p>
                        <p className="text-xs text-neutral-500">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <Btn size="sm" disabled={isSubmitting} onClick={() => startEditing(grade)}>Edit</Btn>
                      <Btn size="sm" variant="danger" disabled={isSubmitting} onClick={() => deleteGrade(grade.id)}>Delete</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-5 py-4 text-center text-sm text-neutral-500">No grades yet</div>
        ))}
    </div>
  );
}
