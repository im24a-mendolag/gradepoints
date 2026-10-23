"use client";

import { useDashboard } from "../DashboardContext";
import { getGradeColor, formatWeight, subjectColorVar } from "../utils";
import type { Grade } from "../types";
import Btn from "./Btn";
import Chip from "./Chip";
import { IconChevron } from "./Icons";
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
  const inputCls =
    "px-3 py-1.5 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none text-sm text-fg";

  return (
    <div className="bg-surface rounded-card border border-line overflow-hidden">
      <button
        onClick={() => toggleExpand(expandKey)}
        aria-expanded={isExpanded}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-hover/50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: subjectColorVar(title) }} />
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-fg truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-fg-faint truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {adj !== 0 && (
            <Chip tone={adj > 0 ? "pass" : "fail"}>
              {adj > 0 ? "+" : ""}{adj}
            </Chip>
          )}
          <span className="text-[11px] text-fg-faint hidden sm:inline">
            {grades.length} grade{grades.length !== 1 ? "s" : ""}
          </span>
          <span
            className={`font-mono text-sm px-2.5 py-1 rounded-control border ${avg !== null ? getGradeColor(avg) : "grade-none"}`}
          >
            {avg !== null ? (
              <>
                Ø {avg.toFixed(1)}
                {rawAvg !== null && (
                  <span className="text-fg-faint ml-1 text-[11px]">({rawAvg.toFixed(3)})</span>
                )}
              </>
            ) : "—"}
          </span>
          <IconChevron size={14} className={`text-fg-faint transition-transform ${isExpanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {isExpanded &&
        (grades.length > 0 ? (
          <div className="divide-y divide-line border-t border-line">
            {grades.map((grade) => (
              <div key={grade.id} className="px-4 py-3 hover:bg-hover/40 transition">
                {editingGrade === grade.id ? (
                  <div className="space-y-3 py-1">
                    <div>
                      <label className="block text-[11px] font-medium text-fg-faint mb-1.5">Grade</label>
                      <GradePicker value={editValue} onChange={setEditValue} noSlider />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-fg-faint mb-1.5">Weight</label>
                      <WeightPicker value={editWeight} onChange={setEditWeight} noSlider />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className={`flex-1 ${inputCls}`}
                        placeholder="Description"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className={`w-full sm:w-auto ${inputCls}`}
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-control font-mono text-sm border shrink-0 ${getGradeColor(grade.value)}`}>
                        {grade.value}
                      </span>
                      <span className="text-[11px] text-fg-faint font-mono shrink-0">×{formatWeight(grade.weight)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-fg truncate">{grade.description || "No description"}</p>
                        <p className="text-[11px] text-fg-faint font-mono">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Btn size="sm" disabled={isSubmitting} onClick={() => startEditing(grade)}>Edit</Btn>
                      <Btn size="sm" variant="danger" disabled={isSubmitting} onClick={() => deleteGrade(grade.id)}>Delete</Btn>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-4 text-center text-sm text-fg-faint border-t border-line">No grades yet</div>
        ))}
    </div>
  );
}
