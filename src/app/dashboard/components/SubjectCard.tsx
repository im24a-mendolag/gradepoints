"use client";

import { useState } from "react";
import { useDashboard, type BulkGradeEntry } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";
import Btn from "./Btn";
import TargetCalculator from "./TargetCalculator";

const GRADE_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const WEIGHT_VALUES = [1/3, 2/3, 0.5, 1, 1.5, 2];

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

function GradePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parsed = parseFloat(value);
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {GRADE_VALUES.map((v) => {
        const selected = value === String(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(String(v))}
            className={`w-10 h-9 rounded-lg text-sm font-bold border transition cursor-pointer select-none
              ${selected
                ? `${getGradeColor(v)} ring-2 ring-blue-400 ring-offset-1 ring-offset-neutral-900`
                : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              }`}
          >
            {v}
          </button>
        );
      })}
      <input
        type="number"
        min="1"
        max="6"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className={`w-20 px-2 h-9 rounded-lg border text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
          ${!isNaN(parsed) && parsed >= 1 && parsed <= 6
            ? `${getGradeColor(parsed)} border-blue-400`
            : "border-neutral-700 bg-neutral-800 text-neutral-300"
          }`}
        placeholder="custom"
      />
    </div>
  );
}

function WeightPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {WEIGHT_VALUES.map((w) => {
        const selected = value === String(w);
        return (
          <button
            key={w}
            type="button"
            onClick={() => onChange(String(w))}
            className={`px-3 h-9 rounded-lg text-sm font-medium border transition cursor-pointer select-none
              ${selected
                ? "bg-blue-600 border-blue-500 text-white"
                : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200"
              }`}
          >
            ×{formatWeight(w)}
          </button>
        );
      })}
      <input
        type="number"
        min="0"
        max="10"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className="w-20 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm font-bold text-neutral-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
        placeholder="custom"
      />
    </div>
  );
}

/**
 * Renders a subject card for a regular semester.
 * Pulls all state and actions from DashboardContext.
 * @param subject - The subject name (e.g. "Math").
 */
export default function SubjectCard({ subject }: { subject: string }) {
  const [activePanel, setActivePanel] = useState<"add" | "paste" | "target" | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [targetAvg, setTargetAvg] = useState("");
  const [targetWeight, setTargetWeight] = useState("1");

  const {
    activeSemester,
    getGradesForSubject,
    getSubjectAverage,
    getRawSubjectAverage,
    getAdjustment,
    expandedSubjects,
    toggleExpand,
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

  const openPanel = (panel: "add" | "paste" | "target") => {
    if (activePanel === panel) { closePanel(); return; }
    setActivePanel(panel);
    if (panel === "paste") setPasteText("");
    if (panel === "target") { setTargetAvg(""); setTargetWeight("1"); }
    if (panel === "add") startAdding(subject);
    if (panel !== "add") cancelAdding();
  };

  const closePanel = () => {
    setActivePanel(null);
    cancelAdding();
  };

  const parsedGrades = activePanel === "paste" ? parsePastedGrades(pasteText) : [];

  const handleImport = async () => {
    if (parsedGrades.length === 0 || isImporting) return;
    setIsImporting(true);
    await bulkImportGrades(subject, parsedGrades);
    setActivePanel(null);
    setPasteText("");
    setIsImporting(false);
  };

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
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => toggleExpand(subject)}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title={isExpanded ? "Hide grades" : "Show grades"}
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
          </button>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{subject}</h3>
          {avg !== null && (
            <span className={`text-xs sm:text-sm font-medium px-2 sm:px-2.5 py-0.5 rounded-full border ${getGradeColor(avg)}`}>
              Ø {avg.toFixed(1)}
              {rawAvg !== null && (
                <span className="text-neutral-500 font-normal ml-1">({rawAvg.toFixed(3)})</span>
              )}
            </span>
          )}
          {adj !== 0 && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${adj > 0 ? "text-green-400 bg-green-900/30 border-green-700" : "text-red-400 bg-red-900/30 border-red-700"}`}>
              {adj > 0 ? "+" : ""}{adj}
            </span>
          )}
          <span className="text-xs text-neutral-500">
            {subjectGrades.length} grade{subjectGrades.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-6 sm:ml-0">
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
              <Btn size="sm" variant="primary" onClick={() => handleSaveAdjustment(activeSemester, subject)}>Save</Btn>
              <Btn size="sm" onClick={cancelEditingAdjustment}>Cancel</Btn>
            </div>
          ) : (
            <Btn size="sm" onClick={() => startEditingAdjustment(activeSemester, subject)} title="Set bonus/malus">±</Btn>
          )}
          <Btn size="sm" variant={activePanel === "target" ? "primary" : "secondary"} onClick={() => openPanel("target")} title="Calculate required grade">Target</Btn>
          <Btn size="sm" variant={activePanel === "paste" ? "primary" : "secondary"} onClick={() => openPanel("paste")} title="Paste grades from school website">Paste</Btn>
          <Btn variant={activePanel === "add" ? "primary" : "secondary"} onClick={() => openPanel("add")} className="gap-1.5">
            <span className="text-base leading-none">+</span> Add Grade
          </Btn>
        </div>
      </div>

      {/* Add Grade Form */}
      {activePanel === "add" && (
        <div className="px-4 sm:px-6 py-4 bg-blue-950/30 border-b border-blue-900/30">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">Grade</label>
              <GradePicker value={gradeValue} onChange={setGradeValue} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2">Weight</label>
              <WeightPicker value={gradeWeight} onChange={setGradeWeight} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={gradeDescription}
                  onChange={(e) => setGradeDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && gradeValue) addGrade(subject); }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100 text-sm"
                  placeholder="e.g. Midterm exam"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">Date</label>
                <input
                  type="date"
                  value={gradeDate}
                  onChange={(e) => setGradeDate(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Btn variant="primary" disabled={!gradeValue} onClick={() => addGrade(subject)}>Add Grade</Btn>
              <Btn onClick={closePanel}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Target Grade Calculator */}
      {activePanel === "target" && <TargetCalculator
        grades={getGradesForSubject(activeSemester, subject)}
        targetAvg={targetAvg}
        targetWeight={targetWeight}
        onTargetAvgChange={setTargetAvg}
        onTargetWeightChange={setTargetWeight}
        onClose={closePanel}
      />}

      {/* Paste Grades Form */}
      {activePanel === "paste" && (
        <div className="px-4 sm:px-6 py-4 bg-neutral-800/60 border-b border-neutral-700">
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
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-bold border shrink-0 ${getGradeColor(g.value)}`}>{g.value}</span>
                  <span className="text-neutral-500">×{formatWeight(g.weight)}</span>
                  <span>{g.description || <em className="text-neutral-500">no description</em>}</span>
                  <span className="text-neutral-500 ml-auto">{g.date}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <Btn variant="primary" disabled={parsedGrades.length === 0 || isImporting} onClick={handleImport}>
              {isImporting ? "Importing…" : `Import ${parsedGrades.length > 0 ? `${parsedGrades.length} grade${parsedGrades.length !== 1 ? "s" : ""}` : ""}`}
            </Btn>
            <Btn onClick={closePanel}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Grades List */}
      {isExpanded &&
        (subjectGrades.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {subjectGrades.map((grade) => (
              <div key={grade.id} className="px-4 sm:px-6 py-3 hover:bg-neutral-800/50 transition">
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
                      <span className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-bold text-sm border shrink-0 ${getGradeColor(grade.value)}`}>
                        {grade.value}
                      </span>
                      <span className="text-xs text-neutral-500 font-medium shrink-0">×{formatWeight(grade.weight)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-neutral-200 truncate">{grade.description || "No description"}</p>
                        <p className="text-xs text-neutral-500">{new Date(grade.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Btn size="sm" onClick={() => startEditing(grade)}>Edit</Btn>
                      <Btn size="sm" variant="danger" onClick={() => deleteGrade(grade.id)}>Delete</Btn>
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
