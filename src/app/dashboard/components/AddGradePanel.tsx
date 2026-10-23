"use client";

import { useState, useEffect } from "react";
import {
  SEMESTER_SUBJECTS,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
  BZZ_MODULE_NAMES,
  KSH_SUBJECT_NAMES,
} from "@/lib/semesters";
import { useDashboard, type BulkGradeEntry } from "../DashboardContext";
import { getGradeColor, blockNonNumericKeys, formatWeight, roundToHalf } from "../utils";
import Btn from "./Btn";
import { GradePicker, WeightPicker, SliderLabels, GRADE_LABELS, calcGradeFromPoints } from "./GradePickers";

const fieldLabel = "block text-[11px] font-medium text-fg-muted mb-1.5";
const textInput =
  "px-3 py-2 rounded-control border border-line bg-sunken text-sm text-fg outline-none focus:ring-2 focus:ring-line-strong focus:border-transparent";

function SubjectCombobox({ options, value, onChange, getLabel }: { options: string[]; value: string; onChange: (v: string) => void; getLabel?: (v: string) => string }) {
  const label = (v: string) => getLabel ? getLabel(v) : v;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const filtered = query
    ? options.filter((o) => label(o).toLowerCase().includes(query.toLowerCase()) || o.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (value) onChange(""); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Select or type subject…"
        className={`w-full ${textInput}`}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 rounded-control border border-line bg-surface shadow-lg max-h-52 overflow-y-auto">
          {filtered.map((option) => (
            <li
              key={option}
              onMouseDown={() => { onChange(option); setQuery(label(option)); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-hover ${value === option ? "text-fg font-medium" : "text-fg-muted"}`}
            >
              {label(option)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GradeScaleBar({ currentAvg, neededRounded }: { currentAvg: number | null; neededRounded?: number | null }) {
  const pct = (v: number) => `${((Math.min(6, Math.max(1, v)) - 1) / 5) * 100}%`;

  return (
    <div>
      <div className="flex justify-between text-[11px] font-mono text-fg-faint mb-0.5">
        {[1, 2, 3, 4, 5, 6].map((v) => <span key={v}>{v}</span>)}
      </div>
      <div className="relative py-2">
        <div className="h-2 rounded-full overflow-hidden flex">
          <div style={{ width: "60%", backgroundColor: "color-mix(in srgb, var(--grade-10) 70%, transparent)" }} />
          <div style={{ width: "10%", backgroundColor: "color-mix(in srgb, var(--grade-40) 70%, transparent)" }} />
          <div className="flex-1" style={{ backgroundColor: "color-mix(in srgb, var(--grade-60) 70%, transparent)" }} />
        </div>
        <div className="absolute inset-y-0 w-px bg-line-strong" style={{ left: "60%" }} />
        {currentAvg !== null && currentAvg >= 1 && currentAvg <= 6 && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(currentAvg) }}>
            <div className="w-4 h-4 rounded-full bg-ink ring-2 ring-surface shadow-sm" />
          </div>
        )}
        {neededRounded !== null && neededRounded !== undefined && neededRounded >= 1 && neededRounded <= 6 && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: pct(neededRounded) }}>
            <div className="w-4 h-4 rounded-full bg-subject-green ring-2 ring-surface shadow-sm" />
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-1.5 text-xs flex-wrap">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span className="inline-block w-3 h-3 rounded-full bg-ink shrink-0" />
          Current avg: <span className="font-mono">{currentAvg !== null && currentAvg >= 1 && currentAvg <= 6 ? currentAvg.toFixed(2) : "—"}</span>
        </span>
        <span className={`flex items-center gap-1.5 ${neededRounded != null && neededRounded > 6 ? "text-now" : "text-subject-green"}`}>
          <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${neededRounded != null && neededRounded > 6 ? "bg-now" : "bg-subject-green"}`} />
          Needed: <span className="font-mono">{neededRounded != null && neededRounded >= 1 ? neededRounded.toFixed(2) : "—"}</span>
        </span>
      </div>
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

export default function AddGradePanel({ noSlider }: { noSlider?: boolean }) {
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
    getAdjustment,
    getBzzModuleAdjustment,
    saveAdjustment,
    saveBzzAdjustment,
    isSubmitting,
  } = useDashboard();

  const [localSubject, setLocalSubject] = useState("");
  const [inputMode, setInputMode] = useState<"grade" | "points">("grade");
  const [myPoints, setMyPoints] = useState("");
  const [totalPoints, setTotalPoints] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "paste" | "target">("add");
  const [targetAvg, setTargetAvg] = useState("4");
  const [targetWeight, setTargetWeight] = useState("1");

  const subjectOptions: string[] =
    activeSchool === "BZZ"
      ? [...(BZZ_NORMAL_MODULES as readonly string[]), ...(BZZ_UK_MODULES as readonly string[]), BZZ_IPA]
      : (SEMESTER_SUBJECTS[activeSemester] ?? []);

  const adj = localSubject
    ? activeSchool === "BZZ"
      ? getBzzModuleAdjustment(localSubject)
      : getAdjustment(activeSemester, localSubject)
    : 0;

  const [adjInput, setAdjInput] = useState(adj !== 0 ? String(adj) : "");
  useEffect(() => {
    setAdjInput(adj !== 0 ? String(adj) : "");
  }, [localSubject]); // eslint-disable-line react-hooks/exhaustive-deps

  const commitAdj = () => {
    if (!localSubject) return;
    const val = parseFloat(adjInput);
    const normalized = isNaN(val) ? 0 : val;
    if (activeSchool === "BZZ") saveBzzAdjustment(localSubject, normalized);
    else saveAdjustment(activeSemester, localSubject, normalized);
  };

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
  const currentAvg = activeGrades.length > 0 ? weightedSum / totalGradeWeight : null;
  const targetIsHalfGrade = !isNaN(parsedTarget) && Math.abs(parsedTarget * 2 - Math.round(parsedTarget * 2)) < 0.001;
  const roundedTargetMin = targetIsHalfGrade ? parsedTarget - 0.25 : null;
  const neededForRoundedAvg =
    roundedTargetMin !== null && !isNaN(parsedTargetWeight) && parsedTargetWeight > 0
      ? (roundedTargetMin * (totalGradeWeight + parsedTargetWeight) - weightedSum) / parsedTargetWeight
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

  const tabBtn = (active: boolean) =>
    `w-16 py-1 rounded-control text-xs font-medium transition cursor-pointer text-center ${
      active ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg hover:bg-hover"
    }`;

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-line rounded-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-1 rounded-control bg-sunken p-0.5">
            {(["add", "paste"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={tabBtn(activeTab === tab)}>
                {tab === "add" ? "Add" : "Paste"}
              </button>
            ))}
          </div>
          <div className="rounded-control bg-sunken p-0.5">
            <button
              onClick={() => setActiveTab(activeTab === "target" ? "add" : "target")}
              className={tabBtn(activeTab === "target")}
            >
              Target
            </button>
          </div>
        </div>

        <div className="px-4 pb-1">
          <SubjectCombobox
            options={subjectOptions}
            value={localSubject}
            onChange={setLocalSubject}
            getLabel={(v) => {
              const name = activeSchool === "BZZ" ? BZZ_MODULE_NAMES[v] : KSH_SUBJECT_NAMES[v];
              return name ? `${v} – ${name}` : v;
            }}
          />
        </div>

        <div className="px-4 pb-4 pt-3 grid">
          <div className={`col-start-1 row-start-1 space-y-3 ${activeTab === "add" ? "" : "invisible pointer-events-none"}`}>
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-fg-faint shrink-0">Bonus/Malus</label>
              <input
                type="number" step="any" value={adjInput}
                onChange={(e) => setAdjInput(e.target.value)}
                onBlur={commitAdj}
                onKeyDown={(e) => { blockNonNumericKeys(e, { allowNegative: true }); if (e.key === "Enter") commitAdj(); }}
                disabled={!localSubject}
                className={`w-20 text-center ${textInput} py-1 disabled:opacity-40 disabled:cursor-not-allowed`}
                placeholder="±0.0"
              />
            </div>
            <div className="flex rounded-control bg-sunken p-0.5 text-xs w-fit">
              <button type="button" onClick={() => setInputMode("grade")} className={`px-2.5 py-1 rounded-control transition cursor-pointer ${inputMode === "grade" ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"}`}>Grade</button>
              <button type="button" onClick={() => { setInputMode("points"); setGradeValue(""); setMyPoints(""); setTotalPoints(""); }} className={`px-2.5 py-1 rounded-control transition cursor-pointer ${inputMode === "points" ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"}`}>Points</button>
            </div>
            <div>
              <label className={fieldLabel}>Grade</label>
              {inputMode === "grade" ? (
                <GradePicker value={gradeValue} onChange={setGradeValue} noSlider={noSlider} />
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <input type="number" min="0" step="any" value={myPoints} onChange={(e) => { setMyPoints(e.target.value); setGradeValue(calcGradeFromPoints(e.target.value, totalPoints)); }} onKeyDown={(e) => blockNonNumericKeys(e)} className={`w-24 h-9 text-center ${textInput}`} placeholder="My pts" />
                  <span className="text-fg-faint text-sm">/</span>
                  <input type="number" min="0" step="any" value={totalPoints} onChange={(e) => { setTotalPoints(e.target.value); setGradeValue(calcGradeFromPoints(myPoints, e.target.value)); }} onKeyDown={(e) => blockNonNumericKeys(e)} className={`w-24 h-9 text-center ${textInput}`} placeholder="Max pts" />
                  {gradeValue && <span className={`inline-flex items-center justify-center px-3 h-9 rounded-control font-mono text-sm border ${getGradeColor(parseFloat(gradeValue))}`}>= {parseFloat(gradeValue).toFixed(3)}</span>}
                </div>
              )}
            </div>
            <div>
              <label className={fieldLabel}>Weight</label>
              <WeightPicker value={gradeWeight} onChange={setGradeWeight} noSlider={noSlider} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={fieldLabel}>Description (optional)</label>
                <input type="text" value={gradeDescription} onChange={(e) => setGradeDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !isAddDisabled) handleAdd(); }} className={`w-full ${textInput}`} placeholder="e.g. Midterm exam" />
              </div>
              <div>
                <label className={fieldLabel}>Date</label>
                <input type="date" value={gradeDate} onChange={(e) => setGradeDate(e.target.value)} className={`${textInput} font-mono`} />
              </div>
            </div>
            <Btn variant="primary" disabled={isAddDisabled || isSubmitting} onClick={handleAdd}>
              {isSubmitting ? "Adding…" : "Add Grade"}
            </Btn>
          </div>

          <div className={`col-start-1 row-start-1 flex flex-col gap-3 ${activeTab === "paste" ? "" : "invisible pointer-events-none"}`}>
            <p className="text-xs text-fg-muted">Paste tab-separated grades (Name, Grade, Date DD.MM.YYYY, Weight)</p>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} className={`flex-1 min-h-0 w-full resize-none font-mono ${textInput}`} placeholder={"Prüfung 1\t4.4\t15.09.2025\t1\nPolitik-Podcast\t4.7\t24.09.2025\t1"} />
            {parsedGrades.length > 0 && (
              <div className="space-y-1">
                {parsedGrades.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-fg-muted">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-control font-mono border shrink-0 ${getGradeColor(g.value)}`}>{g.value}</span>
                    <span className="text-fg-faint font-mono">×{formatWeight(g.weight)}</span>
                    <span className="truncate">{g.description || <em className="text-fg-faint">no description</em>}</span>
                    <span className="text-fg-faint ml-auto shrink-0 font-mono">{g.date}</span>
                  </div>
                ))}
              </div>
            )}
            <Btn variant="primary" disabled={parsedGrades.length === 0 || isImporting || !localSubject} onClick={handleImport}>
              {isImporting ? "Importing…" : `Import ${parsedGrades.length > 0 ? `${parsedGrades.length} grade${parsedGrades.length !== 1 ? "s" : ""}` : ""}`}
            </Btn>
          </div>

          <div className={`col-start-1 row-start-1 flex flex-col gap-3 ${activeTab === "target" ? "" : "invisible pointer-events-none"}`}>
            <p className="text-xs text-fg-muted">What grade do you need to reach your target average?</p>
            <div>
              <label className={fieldLabel}>Target average</label>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center justify-center w-14 h-9 rounded-control font-mono text-sm border shrink-0 transition ${getGradeColor(parseFloat(targetAvg))}`}>
                  {targetAvg}
                </span>
                {!noSlider && (
                  <div className="flex-1 pb-1">
                    <SliderLabels labels={GRADE_LABELS} min={1} max={6} />
                    <input type="range" min="1" max="6" step="0.5" value={targetAvg} onChange={(e) => setTargetAvg(e.target.value)} className="w-full h-2 rounded-control cursor-pointer accent-fg bg-line" />
                  </div>
                )}
                <input
                  type="number" min="1" max="6" step="any" value={targetAvg}
                  onChange={(e) => setTargetAvg(e.target.value)}
                  onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setTargetAvg(String(Math.min(6, Math.max(1, roundToHalf(v))))); }}
                  onKeyDown={(e) => blockNonNumericKeys(e)}
                  className={`h-9 text-center ${textInput} ${noSlider ? "flex-1" : "w-16"}`}
                />
              </div>
            </div>
            <div>
              <label className={fieldLabel}>Weight of grade</label>
              <WeightPicker value={targetWeight} onChange={setTargetWeight} noSlider={noSlider} />
            </div>
            <div>
              <label className={fieldLabel}>Overview</label>
              <GradeScaleBar currentAvg={localSubject ? currentAvg : null} neededRounded={localSubject ? neededForRoundedAvg : null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
