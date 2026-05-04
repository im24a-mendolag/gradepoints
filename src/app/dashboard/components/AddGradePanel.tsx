"use client";

import { useState } from "react";
import {
  SEMESTER_SUBJECTS,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "@/lib/semesters";
import { useDashboard, type BulkGradeEntry } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";
import Btn from "./Btn";
import { GradePicker, WeightPicker, calcGradeFromPoints } from "./GradePickers";

function SubjectCombobox({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const filtered = query ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(""); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Select or type subject…"
        className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl max-h-52 overflow-y-auto">
          {filtered.map((option) => (
            <li
              key={option}
              onMouseDown={() => { onChange(option); setQuery(option); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-neutral-700 ${value === option ? "text-blue-400" : "text-neutral-100"}`}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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

export default function AddGradePanel() {
  const {
    activeSchool,
    activeSemester,
    gradeValue, setGradeValue,
    gradeWeight, setGradeWeight,
    gradeDescription, setGradeDescription,
    gradeDate, setGradeDate,
    addGrade,
    addBzzGrade,
    bulkImportGrades,
    getGradesForSubject,
    getBzzModuleGrades,
  } = useDashboard();

  const [localSubject, setLocalSubject] = useState("");
  const [inputMode, setInputMode] = useState<"grade" | "points">("grade");
  const [myPoints, setMyPoints] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "target" | "paste">("add");
  const [targetAvg, setTargetAvg] = useState("");
  const [targetWeight, setTargetWeight] = useState("1");

  const subjectOptions: string[] =
    activeSchool === "BZZ"
      ? [...(BZZ_NORMAL_MODULES as readonly string[]), ...(BZZ_UK_MODULES as readonly string[]), BZZ_IPA]
      : (SEMESTER_SUBJECTS[activeSemester] ?? []);

  const grades = localSubject
    ? activeSchool === "BZZ"
      ? getBzzModuleGrades(localSubject)
      : getGradesForSubject(activeSemester, localSubject)
    : [];

  const activeGrades = grades.filter((g) => g.weight > 0);
  const weightedSum = activeGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
  const totalGradeWeight = activeGrades.reduce((acc, g) => acc + g.weight, 0);
  const parsedTarget = parseFloat(targetAvg);
  const parsedTargetWeight = parseFloat(targetWeight);
  const needed =
    !isNaN(parsedTarget) && !isNaN(parsedTargetWeight) && parsedTargetWeight > 0
      ? (parsedTarget * (totalGradeWeight + parsedTargetWeight) - weightedSum) / parsedTargetWeight
      : null;
  const clamped = needed !== null ? Math.min(6, Math.max(1, needed)) : null;
  const impossible = needed !== null && (needed < 1 || needed > 6);

  const parsedGrades = pasteText ? parsePastedGrades(pasteText) : [];

  const handleAdd = async () => {
    if (!localSubject || !gradeValue) return;
    if (activeSchool === "BZZ") await addBzzGrade(localSubject);
    else await addGrade(localSubject);
    setMyPoints("");
    setTotalPoints("");
  };

  const handleImport = async () => {
    if (parsedGrades.length === 0 || isImporting || !localSubject) return;
    setIsImporting(true);
    await bulkImportGrades(localSubject, parsedGrades);
    setPasteText("");
    setIsImporting(false);
  };

  const isAddDisabled =
    !localSubject || !gradeValue || parseFloat(gradeValue) < 1 || parseFloat(gradeValue) > 6;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-100">Add Grade</h2>
        <div className="flex gap-1">
          {(["add", "target", "paste"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              {tab === "add" ? "Add" : tab === "target" ? "Target" : "Paste"}
            </button>
          ))}
        </div>
      </div>

      {/* Subject selector */}
      <div className="px-4 py-3 border-b border-neutral-800">
        <SubjectCombobox options={subjectOptions} value={localSubject} onChange={setLocalSubject} />
      </div>

      {/* Content */}
      <div className="px-4 py-4">

        {/* Add tab */}
        {activeTab === "add" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <label className="text-xs font-medium text-neutral-400">Grade</label>
                <div className="flex rounded-md border border-neutral-700 overflow-hidden text-xs">
                  <button type="button" onClick={() => setInputMode("grade")} className={`px-2.5 py-1 transition cursor-pointer ${inputMode === "grade" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>Grade</button>
                  <button type="button" onClick={() => { setInputMode("points"); setGradeValue(""); setMyPoints(""); setTotalPoints(""); }} className={`px-2.5 py-1 transition cursor-pointer ${inputMode === "points" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>Points</button>
                </div>
              </div>
              {inputMode === "grade" ? (
                <GradePicker value={gradeValue} onChange={setGradeValue} />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="number" min="0" step="any" value={myPoints} onChange={(e) => { setMyPoints(e.target.value); setGradeValue(calcGradeFromPoints(e.target.value, totalPoints)); }} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-24 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500" placeholder="My pts" />
                  <span className="text-neutral-500 text-sm">/</span>
                  <input type="number" min="0" step="any" value={totalPoints} onChange={(e) => { setTotalPoints(e.target.value); setGradeValue(calcGradeFromPoints(myPoints, e.target.value)); }} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-24 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500" placeholder="Max pts" />
                  {gradeValue && <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${getGradeColor(parseFloat(gradeValue))}`}>= {parseFloat(gradeValue).toFixed(3)}</span>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Weight</label>
              <WeightPicker value={gradeWeight} onChange={setGradeWeight} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Description (optional)</label>
                <input type="text" value={gradeDescription} onChange={(e) => setGradeDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !isAddDisabled) handleAdd(); }} className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-100 text-sm" placeholder="e.g. Midterm exam" />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">Date</label>
                <input type="date" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 outline-none text-neutral-100 text-sm" />
              </div>
            </div>
            <Btn variant="primary" disabled={isAddDisabled} onClick={handleAdd}>Add Grade</Btn>
          </div>
        )}

        {/* Target tab */}
        {activeTab === "target" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">What grade do you need to reach your target average?</p>
            <div className="flex gap-3 flex-wrap">
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Target average</label>
                <input type="number" min="1" max="6" step="any" value={targetAvg} onChange={(e) => setTargetAvg(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-32 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" placeholder="e.g. 5" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1.5">Weight of new grade</label>
                <input type="number" min="0" step="any" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-32 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" />
              </div>
              {needed !== null && (
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Needed</label>
                  <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${impossible ? "border-red-800 bg-red-900/30 text-red-400" : getGradeColor(clamped!)}`}>{needed.toFixed(2)}</span>
                  {impossible && <span className="ml-2 text-xs text-red-400">{needed > 6 ? "Not achievable" : "Already achieved!"}</span>}
                </div>
              )}
            </div>
            {!localSubject && <p className="text-xs text-neutral-500">Select a subject above to calculate based on existing grades.</p>}
          </div>
        )}

        {/* Paste tab */}
        {activeTab === "paste" && (
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">Paste tab-separated grades (Name, Grade, Date DD.MM.YYYY, Weight)</p>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" placeholder={"Prüfung 1\t4.4\t15.09.2025\t1\nPolitik-Podcast\t4.7\t24.09.2025\t1"} autoFocus />
            {parsedGrades.length > 0 && (
              <div className="space-y-1">
                {parsedGrades.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded font-bold border shrink-0 ${getGradeColor(g.value)}`}>{g.value}</span>
                    <span className="text-neutral-500">×{formatWeight(g.weight)}</span>
                    <span className="truncate">{g.description || <em className="text-neutral-500">no description</em>}</span>
                    <span className="text-neutral-500 ml-auto shrink-0">{g.date}</span>
                  </div>
                ))}
              </div>
            )}
            <Btn variant="primary" disabled={parsedGrades.length === 0 || isImporting || !localSubject} onClick={handleImport}>
              {isImporting ? "Importing…" : `Import ${parsedGrades.length > 0 ? `${parsedGrades.length} grade${parsedGrades.length !== 1 ? "s" : ""}` : ""}`}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
