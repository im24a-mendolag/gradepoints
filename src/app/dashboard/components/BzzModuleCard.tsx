"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys } from "../utils";
import { BZZ_SEMESTER } from "@/lib/semesters";
import Btn from "./Btn";
import TargetCalculator from "./TargetCalculator";

const GRADE_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const WEIGHT_VALUES = [0.5, 1, 1.5, 2];

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
            ×{w}
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
 * Renders a module card for BZZ.
 * Similar to SubjectCard but uses BZZ-specific context functions.
 * @param mod - The module name/number (e.g. "431").
 */
export default function BzzModuleCard({ mod }: { mod: string }) {
  const [isTargeting, setIsTargeting] = useState(false);
  const [targetAvg, setTargetAvg] = useState("");
  const [targetWeight, setTargetWeight] = useState("1");

  const {
    getBzzModuleGrades,
    getBzzModuleAverage,
    getBzzModuleRawAverage,
    getBzzModuleAdjustment,
    expandedSubjects,
    toggleExpand,
    addingFor,
    startAdding,
    cancelAdding,
    gradeValue, setGradeValue,
    gradeWeight, setGradeWeight,
    gradeDescription, setGradeDescription,
    gradeDate, setGradeDate,
    addBzzGrade,
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
    saveBzzAdjustment,
  } = useDashboard();

  const modGrades = getBzzModuleGrades(mod);
  const avg = getBzzModuleAverage(mod);
  const rawAvg = getBzzModuleRawAverage(mod);
  const adj = getBzzModuleAdjustment(mod);
  const adjKey = `${BZZ_SEMESTER}-${mod}`;
  const expandKey = `bzz-${mod}`;
  const addKey = `bzz-${mod}`;
  const isExpanded = expandedSubjects.has(expandKey);
  const isAdding = addingFor === addKey;
  const isEditingAdj = editingAdjustment === adjKey;

  const handleToggle = () => toggleExpand(expandKey);
  const handleStartAdding = () => startAdding(addKey);

  const handleStartEditingAdj = () => {
    startEditingAdjustment(BZZ_SEMESTER, mod);
  };

  const handleSaveAdj = () => {
    const val = parseFloat(adjustmentInput);
    saveBzzAdjustment(mod, isNaN(val) ? 0 : val);
    cancelEditingAdjustment();
  };

  return (
    <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 overflow-hidden">
      {/* Module Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-neutral-800">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={handleToggle}
            className="text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            title={isExpanded ? "Hide grades" : "Show grades"}
          >
            <span className={`inline-block transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
          </button>
          <h3 className="text-base sm:text-lg font-semibold text-neutral-100">{mod}</h3>
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
            {modGrades.length} grade{modGrades.length !== 1 ? "s" : ""}
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
                  if (e.key === "Enter") handleSaveAdj();
                }}
                className="w-20 px-2 py-1 rounded border border-neutral-600 bg-neutral-800 text-sm text-center outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-neutral-100"
                placeholder="±0.0"
                autoFocus
              />
              <Btn size="sm" variant="primary" onClick={handleSaveAdj}>Save</Btn>
              <Btn size="sm" onClick={cancelEditingAdjustment}>Cancel</Btn>
            </div>
          ) : (
            <Btn size="sm" onClick={handleStartEditingAdj} title="Set bonus/malus">±</Btn>
          )}
          <Btn size="sm" onClick={() => { setIsTargeting(true); setTargetAvg(""); setTargetWeight("1"); }} title="Calculate required grade">Target</Btn>
          <Btn variant="primary" onClick={handleStartAdding} className="gap-1.5">
            <span className="text-base leading-none">+</span> Add Grade
          </Btn>
        </div>
      </div>

      {/* Target Grade Calculator */}
      {isTargeting && <TargetCalculator
        grades={getBzzModuleGrades(mod)}
        targetAvg={targetAvg}
        targetWeight={targetWeight}
        onTargetAvgChange={setTargetAvg}
        onTargetWeightChange={setTargetWeight}
        onClose={() => { setIsTargeting(false); setTargetAvg(""); }}
      />}

      {/* Add Grade Form */}
      {isExpanded && isAdding && (
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
                  onKeyDown={(e) => { if (e.key === "Enter" && gradeValue) addBzzGrade(mod); }}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-neutral-100 text-sm"
                  placeholder="e.g. Module exam"
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
              <Btn variant="primary" disabled={!gradeValue} onClick={() => addBzzGrade(mod)}>Add Grade</Btn>
              <Btn onClick={cancelAdding}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Grades List */}
      {isExpanded &&
        (modGrades.length > 0 ? (
          <div className="divide-y divide-neutral-800">
            {modGrades.map((grade) => (
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
                      <span className="text-xs text-neutral-500 font-medium shrink-0">×{grade.weight}</span>
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
