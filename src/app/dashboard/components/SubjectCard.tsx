"use client";

import { useDashboard } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";
import Btn from "./Btn";
import { GradePicker, WeightPicker } from "./GradePickers";

export default function SubjectCard({ subject }: { subject: string }) {
  const {
    activeSemester,
    getGradesForSubject,
    getSubjectAverage,
    getRawSubjectAverage,
    getAdjustment,
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
    editingAdjustment,
    startEditingAdjustment,
    cancelEditingAdjustment,
    adjustmentInput,
    setAdjustmentInput,
    handleSaveAdjustment,
  } = useDashboard();

  const subjectGrades = getGradesForSubject(activeSemester, subject);
  const avg = getSubjectAverage(activeSemester, subject);
  const rawAvg = getRawSubjectAverage(activeSemester, subject);
  const adj = getAdjustment(activeSemester, subject);
  const adjKey = `${activeSemester}-${subject}`;
  const isExpanded = expandedSubjects.has(subject);
  const isEditingAdj = editingAdjustment === adjKey;

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      {/* Subject Header */}
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
          <button
            onClick={() => toggleExpand(subject)}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition shrink-0"
            title={isExpanded ? "Hide grades" : "Show grades"}
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
          </button>
          <h3 className="text-sm sm:text-base font-semibold text-neutral-100 truncate">{subject}</h3>
          {avg !== null && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${getGradeColor(avg)}`}>
              Ø {avg.toFixed(1)}
              {rawAvg !== null && (
                <span className="text-neutral-500 font-normal ml-1">({rawAvg.toFixed(3)})</span>
              )}
            </span>
          )}
          {adj !== 0 && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border shrink-0 ${adj > 0 ? "text-green-400 bg-green-900/30 border-green-700" : "text-red-400 bg-red-900/30 border-red-700"}`}>
              {adj > 0 ? "+" : ""}{adj}
            </span>
          )}
          <span className="text-xs text-neutral-500 shrink-0">
            {subjectGrades.length} grade{subjectGrades.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isEditingAdj ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="any"
                value={adjustmentInput}
                onChange={(e) => setAdjustmentInput(e.target.value)}
                onKeyDown={(e) => {
                  blockNonNumericKeys(e, { allowNegative: true });
                  if (e.key === "Enter") handleSaveAdjustment(activeSemester, subject);
                }}
                className="w-20 px-2 py-1 rounded border border-neutral-600 bg-neutral-800 text-sm text-center outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-100"
                placeholder="±0.0"
                autoFocus
              />
              <Btn size="sm" variant="primary" onClick={() => handleSaveAdjustment(activeSemester, subject)}>Save</Btn>
              <Btn size="sm" onClick={cancelEditingAdjustment}>Cancel</Btn>
            </div>
          ) : (
            <Btn size="sm" onClick={() => startEditingAdjustment(activeSemester, subject)} title="Set bonus/malus">±</Btn>
          )}
        </div>
      </div>

      {/* Grades List */}
      {isExpanded &&
        (subjectGrades.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {subjectGrades.map((grade) => (
              <div key={grade.id} className="px-4 sm:px-5 py-3 hover:bg-neutral-800/50 transition">
                {editingGrade === grade.id ? (
                  <div className="space-y-3 py-1">
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Grade</label>
                      <GradePicker value={editValue} onChange={setEditValue} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-500 mb-1.5">Weight</label>
                      <WeightPicker value={editWeight} onChange={setEditWeight} />
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
                      <Btn size="sm" variant="primary" onClick={() => updateGrade(grade.id)}>Save</Btn>
                      <Btn size="sm" onClick={cancelEditing}>Cancel</Btn>
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
                      <Btn size="sm" onClick={() => startEditing(grade)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => deleteGrade(grade.id)}>Delete</Btn>
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
