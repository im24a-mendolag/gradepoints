"use client";

import { useState } from "react";
import { useDashboard, type BulkGradeEntry } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys } from "../utils";

function parsePastedGrades(text: string): BulkGradeEntry[] {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .flatMap((line) => {
      const fields = line.split("\t");
      if (fields.length < 2) return [];
      const description = fields[0].trim();
      const rawValue = fields[1].trim().replace(",", ".");
      const value = parseFloat(rawValue);
      if (isNaN(value) || value < 1 || value > 6) return [];

      // Date: DD.MM.YYYY → YYYY-MM-DD, fallback to today
      let date = new Date().toISOString().split("T")[0];
      if (fields[2]) {
        const parts = fields[2].trim().split(".");
        if (parts.length === 3) {
          date = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }

      const rawWeight = fields[3]?.trim().replace(",", ".");
      const weight = rawWeight ? parseFloat(rawWeight) : 1;

      return [{ description, value, date, weight: isNaN(weight) ? 1 : weight }];
    });
}

/**
 * Renders a subject card for a regular semester.
 * Pulls all state and actions from DashboardContext.
 * @param subject - The subject name (e.g. "Math").
 */
export default function SubjectCard({ subject }: { subject: string }) {
  const [isPasting, setIsPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");

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
    bulkImportGrades,
  } = useDashboard();

  const parsedGrades = isPasting ? parsePastedGrades(pasteText) : [];

  const handleImport = async () => {
    if (parsedGrades.length === 0) return;
    await bulkImportGrades(subject, parsedGrades);
    setIsPasting(false);
    setPasteText("");
  };

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
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => toggleExpand(subject)}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title={isExpanded ? "Hide grades" : "Show grades"}
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>
              ▶
            </span>
          </button>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{subject}</h3>
          {avg !== null && (
            <span
              className={`text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-0.5 rounded-full border ${getGradeColor(avg)}`}
            >
              Ø {avg.toFixed(1)}
              {rawAvg !== null && (
                <span className="text-neutral-500 font-normal ml-1">({rawAvg.toFixed(3)})</span>
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
        <div className="flex items-center gap-3 ml-6 sm:ml-0">
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
            onClick={() => { setIsPasting(true); setPasteText(""); }}
            className="text-sm text-neutral-400 hover:text-neutral-200 font-medium cursor-pointer"
            title="Paste grades from school website"
          >
            Paste
          </button>
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
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-blue-900/20 border-b border-blue-900/40">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">
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
                className="w-full sm:w-24 px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
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
                className="w-full sm:w-20 px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
              />
            </div>
            <div className="col-span-2 sm:flex-1 sm:min-w-[200px]">
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
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
              <input
                type="date"
                value={gradeDate}
                onChange={(e) => setGradeDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100"
              />
            </div>
            <div className="col-span-2 flex gap-2 sm:gap-3">
              <button
                onClick={() => addGrade(subject)}
                disabled={!gradeValue}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Add
              </button>
              <button
                onClick={cancelAdding}
                className="flex-1 sm:flex-none px-4 py-2 text-neutral-400 hover:text-neutral-200 text-sm font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste Grades Form */}
      {isPasting && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-800/60 border-b border-neutral-700">
          <p className="text-xs text-neutral-400 mb-2">
            Paste grades from the school website (tab-separated: Name, Grade, Date, Weight)
          </p>
          <textarea
            autoFocus
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-900 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono"
            placeholder={"Prüfung 1\t4.4\t15.09.2025\t1\nPolitik-Podcast\t4.7\t24.09.2025\t1"}
          />
          {parsedGrades.length > 0 && (
            <div className="mt-2 space-y-1">
              {parsedGrades.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-bold border shrink-0 ${getGradeColor(g.value)}`}>
                    {g.value}
                  </span>
                  <span className="text-neutral-500">×{g.weight}</span>
                  <span>{g.description || <em className="text-neutral-500">no description</em>}</span>
                  <span className="text-neutral-500 ml-auto">{g.date}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleImport}
              disabled={parsedGrades.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Import {parsedGrades.length > 0 ? `${parsedGrades.length} grade${parsedGrades.length !== 1 ? "s" : ""}` : ""}
            </button>
            <button
              onClick={() => { setIsPasting(false); setPasteText(""); }}
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
                className="px-4 sm:px-6 py-3 hover:bg-neutral-800/50 transition"
              >
                {editingGrade === grade.id ? (
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 items-end">
                    <input
                      type="number"
                      min="1"
                      max="6"
                      step="0.5"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => blockNonNumericKeys(e)}
                      className="w-full sm:w-24 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      value={editWeight}
                      onChange={(e) => setEditWeight(e.target.value)}
                      onKeyDown={(e) => blockNonNumericKeys(e)}
                      className="w-full sm:w-20 px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="col-span-2 sm:flex-1 sm:min-w-[150px] px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                      placeholder="Description"
                    />
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="col-span-2 w-full sm:w-auto px-3 py-1.5 rounded-lg border border-neutral-600 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-neutral-100"
                    />
                    <div className="col-span-2 flex gap-2">
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
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm border shrink-0 ${getGradeColor(grade.value)}`}
                      >
                        {grade.value}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium shrink-0">×{grade.weight}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-200 truncate">
                          {grade.description || "No description"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(grade.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
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
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 sm:px-6 py-4 text-center text-sm text-neutral-500">No grades yet</div>
        ))}
    </div>
  );
}
