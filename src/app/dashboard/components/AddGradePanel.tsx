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

function GradeScaleBar({ currentAvg, needed, neededRounded }: { currentAvg: number | null; needed: number | null; neededRounded?: number | null }) {
  const pct = (v: number) => `${((Math.min(6, Math.max(1, v)) - 1) / 5) * 100}%`;

  return (
    <div>
      <div className="relative py-2">
        <div className="h-2 rounded-full overflow-hidden flex">
          <div className="bg-red-800/80" style={{ width: "60%" }} />
          <div className="bg-yellow-700/80" style={{ width: "10%" }} />
          <div className="bg-green-700/80 flex-1" />
        </div>
        <div className="absolute inset-y-0 w-px bg-neutral-400/30" style={{ left: "60%" }} />
        {currentAvg !== null && currentAvg >= 1 && currentAvg <= 6 && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(currentAvg) }}>
            <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-neutral-900 shadow-lg" />
          </div>
        )}
        {neededRounded !== null && neededRounded !== undefined && neededRounded >= 1 && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(neededRounded) }}>
            <div className="w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-neutral-900 shadow-lg" />
          </div>
        )}
        {needed !== null && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(needed) }}>
            <div className="w-4 h-4 rounded-full bg-neutral-100 ring-2 ring-neutral-900 shadow-lg" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-neutral-600 mt-0.5">
        {[1, 2, 3, 4, 5, 6].map((v) => <span key={v}>{v}</span>)}
      </div>
      {(currentAvg !== null || needed !== null || neededRounded) && (
        <div className="flex gap-4 mt-1.5 text-xs flex-wrap">
          {currentAvg !== null && currentAvg >= 1 && currentAvg <= 6 && (
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 shrink-0" />
              Current avg: {currentAvg.toFixed(2)}
            </span>
          )}
          {neededRounded !== null && neededRounded !== undefined && neededRounded >= 1 && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
              Needed (rounded avg): {neededRounded.toFixed(2)}
            </span>
          )}
          {needed !== null && (
            <span className="flex items-center gap-1.5 text-neutral-300">
              <span className="inline-block w-3 h-3 rounded-full bg-neutral-100 shrink-0" />
              Needed: {needed.toFixed(2)}
            </span>
          )}
        </div>
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
    isSubmitting,
  } = useDashboard();

  const [localSubject, setLocalSubject] = useState("");
  const [inputMode, setInputMode] = useState<"grade" | "points">("grade");
  const [myPoints, setMyPoints] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "paste" | "target">("add");
  const [targetAvg, setTargetAvg] = useState("");
  const [targetWeight, setTargetWeight] = useState("1");
  const [remainingExams, setRemainingExams] = useState("3");
  const [examWeight, setExamWeight] = useState("1");

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
  const currentAvg = activeGrades.length > 0 ? weightedSum / totalGradeWeight : null;
  const parsedRemainingExams = parseInt(remainingExams);
  const parsedExamWeight = parseFloat(examWeight);
  const neededPerExam =
    !isNaN(parsedTarget) && parsedRemainingExams > 0 && parsedExamWeight > 0
      ? (parsedTarget * (totalGradeWeight + parsedRemainingExams * parsedExamWeight) - weightedSum) /
        (parsedRemainingExams * parsedExamWeight)
      : null;
  const neededPerExamImpossible = neededPerExam !== null && (neededPerExam < 1 || neededPerExam > 6);
  // Only meaningful when target is a 0.5 multiple (3.5, 4.0, 4.5…); otherwise rounding is undefined
  const targetIsHalfGrade = !isNaN(parsedTarget) && Math.abs(parsedTarget * 2 - Math.round(parsedTarget * 2)) < 0.001;
  const roundedTargetMin = targetIsHalfGrade ? parsedTarget - 0.25 : null;
  const neededForRoundedAvg =
    roundedTargetMin !== null && !isNaN(parsedTargetWeight) && parsedTargetWeight > 0
      ? (roundedTargetMin * (totalGradeWeight + parsedTargetWeight) - weightedSum) / parsedTargetWeight
      : null;
  const neededPerExamForRoundedAvg =
    roundedTargetMin !== null && parsedRemainingExams > 0 && parsedExamWeight > 0
      ? (roundedTargetMin * (totalGradeWeight + parsedRemainingExams * parsedExamWeight) - weightedSum) /
        (parsedRemainingExams * parsedExamWeight)
      : null;

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
    <div className="space-y-3 mb-4">
      {/* Add Grade card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-neutral-100">Add Grade</h2>
            <div className="flex gap-1">
              {(["add", "paste"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                  }`}
                >
                  {tab === "add" ? "Add" : "Paste"}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === "target" ? "add" : "target")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
              activeTab === "target"
                ? "bg-blue-600 text-white"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            }`}
          >
            Target
          </button>
        </div>

        <div className="px-4 pb-1">
          <SubjectCombobox options={subjectOptions} value={localSubject} onChange={setLocalSubject} />
        </div>

        <div className="px-4 pb-4 pt-3">
          <div className={activeTab === "add" ? "space-y-3" : "hidden"}>
              <div className="flex rounded-md border border-neutral-700 overflow-hidden text-xs w-fit">
                <button type="button" onClick={() => setInputMode("grade")} className={`px-2.5 py-1 transition cursor-pointer ${inputMode === "grade" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>Grade</button>
                <button type="button" onClick={() => { setInputMode("points"); setGradeValue(""); setMyPoints(""); setTotalPoints(""); }} className={`px-2.5 py-1 transition cursor-pointer ${inputMode === "points" ? "bg-blue-600 text-white" : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"}`}>Points</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2">Grade</label>
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
              <Btn variant="primary" disabled={isAddDisabled || isSubmitting} onClick={handleAdd}>
                {isSubmitting ? "Adding…" : "Add Grade"}
              </Btn>
          </div>

          <div className={activeTab === "paste" ? "flex flex-col gap-3" : "hidden"}>
              <p className="text-xs text-neutral-400">Paste tab-separated grades (Name, Grade, Date DD.MM.YYYY, Weight)</p>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} className="flex-1 min-h-0 w-full px-3 py-2 rounded-lg border border-neutral-600 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" placeholder={"Prüfung 1\t4.4\t15.09.2025\t1\nPolitik-Podcast\t4.7\t24.09.2025\t1"} />
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

          <div className={activeTab === "target" ? "flex flex-col gap-3" : "hidden"}>
              <p className="text-xs text-neutral-400">What grade do you need to reach your target average?</p>
              <div className="flex gap-3 flex-wrap items-end">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Target average</label>
                  <input type="number" min="1" max="6" step="any" value={targetAvg} onChange={(e) => setTargetAvg(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-28 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1.5">Weight of grade</label>
                  <input type="number" min="0" step="any" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-24 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                </div>
                {localSubject && needed !== null && (
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Needed</label>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${impossible ? "border-red-800 bg-red-900/30 text-red-400" : getGradeColor(clamped!)}`}>{needed.toFixed(2)}</span>
                      {impossible && <span className="text-xs text-red-400">{needed > 6 ? "Not achievable" : "Already achieved!"}</span>}
                    </div>
                  </div>
                )}
                {localSubject && neededForRoundedAvg !== null && !impossible && (
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Needed (rounded avg)</label>
                    <div className="flex items-center gap-2">
                      {neededForRoundedAvg < 1
                        ? <span className="text-xs text-green-400">Already achieved!</span>
                        : <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${getGradeColor(Math.min(6, Math.max(1, neededForRoundedAvg)))}`}>{neededForRoundedAvg.toFixed(2)}</span>
                      }
                    </div>
                  </div>
                )}
              </div>
              <GradeScaleBar currentAvg={localSubject ? currentAvg : null} needed={localSubject ? needed : null} neededRounded={localSubject ? neededForRoundedAvg : null} />
              <div>
                <p className="text-xs text-neutral-500 mb-2">Spread across remaining exams</p>
                <div className="flex gap-3 flex-wrap items-end">
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Remaining exams</label>
                    <input type="number" min="1" step="1" value={remainingExams} onChange={(e) => setRemainingExams(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-28 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 mb-1.5">Weight each</label>
                    <input type="number" min="0" step="any" value={examWeight} onChange={(e) => setExamWeight(e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className="w-24 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                  </div>
                  {neededPerExam !== null && (
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1.5">Needed each</label>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${neededPerExamImpossible ? "border-red-800 bg-red-900/30 text-red-400" : getGradeColor(Math.min(6, Math.max(1, neededPerExam)))}`}>{neededPerExam.toFixed(2)}</span>
                        {neededPerExamImpossible && <span className="text-xs text-red-400">{neededPerExam > 6 ? "Not achievable" : "Already achieved!"}</span>}
                      </div>
                    </div>
                  )}
                  {neededPerExamForRoundedAvg !== null && !neededPerExamImpossible && (
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1.5">Each (rounded avg)</label>
                      <div className="flex items-center gap-2">
                        {neededPerExamForRoundedAvg < 1
                          ? <span className="text-xs text-green-400">Already achieved!</span>
                          : <span className={`inline-flex items-center justify-center px-3 h-9 rounded-lg font-bold text-sm border ${getGradeColor(Math.min(6, Math.max(1, neededPerExamForRoundedAvg)))}`}>{neededPerExamForRoundedAvg.toFixed(2)}</span>
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
