"use client";

import { useDashboard } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys } from "../utils";

/**
 * Renders a subject card for a regular semester.
 * Pulls all state and actions from DashboardContext.
 * @param subject - The subject name (e.g. "Math").
 */
export default function SubjectCard({ subject }: { subject: string }) {
  const {
    activeSemester,
    getGradesForSubject,
    getSubjectAverage,
    getRawSubjectAverage,
    getAdjustment,
    expandedSubjects,
    toggleExpand,
    addingFor,
    startAdding,
    cancelAdding,
    gradeValue, setGradeValue,
    gradeWeight, setGradeWeight,
    gradeDescription, setGradeDescription,
    gradeDate, setGradeDate,
    addGrade,
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
  const isAdding = addingFor === subject;
  const isEditingAdj = editingAdjustment === adjKey;

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      {/* Subject Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleExpand(subject)}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title={isExpanded ? "Hide grades" : "Show grades"}
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              ▶
            </span>
          </button>
          <h3 className="text-lg font-semibold text-neutral-100">{subject}</h3>
          {avg !== null && (
            <span
              className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${getGradeColor(avg)}`}
            >
              Ø {avg.toFixed(1)}
              {rawAvg !== null && (
                <span className="text-neutral-500 font-normal ml-1">({rawAvg.toFixed(2)})</span>
              )}
            </span>
          )}
          {adj !== 0 && (
            <span
              className={`text-xs font-medium px-1.5 py-0.5 rounded border ${
                adj > 0
                  ? "text-green-400 bg-green-900/30 border-green-700"
                  : "text-red-400 bg-red-900/30 border-red-700"
              }`}
            >
              {adj > 0 ? "+" : ""}
              {adj}
            </span>
          )}
          <span className="text-xs text-neutral-500">
            {subjectGrades.length} grade{subjectGrades.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Adjustment button */}
          {isEditingAdj ? (
            <div className="flex items-center gap-2">
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
              <button
                onClick={() => handleSaveAdjustment(activeSemester, subject)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={cancelEditingAdjustment}
                className="text-xs text-neutral-400 hover:text-neutral-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => startEditingAdjustment(activeSemester, subject)}
              className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
              title="Set bonus/malus"
            >
              ±
            </button>
          )}
          <button
            onClick={() => startAdding(subject)}
            className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
          >
            + Add Grade
          </button>
        </div>
      </div>

      {/* Add Grade Form */}
      {isExpanded && isAdding && (
        <div className="px-6 py-4 bg-blue-900/20 border-b border-blue-900/40">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Grade (1–6)</label>
              <input
                type="number"
                min="1"
                max="6"
                step="0.5"
                value={gradeValue}
                onChange={(e) => setGradeValue(e.target.value)}
                onKeyDown={(e) => blockNonNumericKeys(e)}
                className="w-24 px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
                placeholder="5.0"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Weight</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={gradeWeight}
                onChange={(e) => setGradeWeight(e.target.value)}
                onKeyDown={(e) => blockNonNumericKeys(e)}
                className="w-20 px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={gradeDescription}
                onChange={(e) => setGradeDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
                placeholder="e.g. Midterm exam"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                value={gradeDate}
                onChange={(e) => setGradeDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
              />
            </div>
            <button
              onClick={() => addGrade(subject)}
              disabled={!gradeValue}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Add
            </button>
            <button
              onClick={cancelAdding}
              className="px-4 py-2 text-neutral-400 hover:text-neutral-200 text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grades List */}
      {isExpanded &&
        (subjectGrades.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {subjectGrades.map((grade) => (
              <div
                key={grade.id}
                className="px-6 py-3 flex items-center justify-between hover:bg-neutral-800/50 transition"
              >
                {editingGrade === grade.id ? (
                  <div className="flex flex-wrap gap-3 items-end flex-1">
                    <input
                      type="number"
                      min="1"
                      max="6"
                      step="0.5"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => blockNonNumericKeys(e)}
                      className="w-24 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      onKeyDown={(e) => blockNonNumericKeys(e)}
                      className="w-20 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                      placeholder="Description"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <button
                      onClick={() => updateGrade(grade.id)}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-sm text-neutral-400 hover:text-neutral-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border ${getGradeColor(grade.value)}`}
                      >
                        {grade.value}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium">×{grade.weight}</span>
                      <div>
                        <p className="text-sm text-neutral-200">
                          {grade.description || "No description"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(grade.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(grade)}
                        className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteGrade(grade.id)}
                        className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-4 text-center text-sm text-neutral-500">No grades yet</div>
        ))}
    </div>
  );
}
