"use client";

import { useState, type ReactNode } from "react";
import {
  SEMESTER_SUBJECTS,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
  BZZ_MODULE_NAMES,
  KSH_SUBJECT_NAMES,
} from "@/lib/semesters";
import { useDashboard, type BulkGradeEntry } from "../DashboardContext";
import type { Grade } from "../types";
import { getGradeColor, blockNonNumericKeys, formatWeight, roundToHalf } from "../utils";
import Btn from "./Btn";
import { GradePicker, WeightPicker, SliderLabels, GRADE_LABELS, calcGradeFromPoints } from "./GradePickers";

const fieldLabel = "block text-[11px] font-medium text-fg-muted mb-1.5";
const textInput =
  "px-3 py-2 rounded-control border border-line bg-sunken text-sm text-fg outline-none focus:ring-2 focus:ring-line-strong focus:border-transparent";

function SubjectCombobox({ options, value, onChange, getLabel }: { options: string[]; value: string; onChange: (v: string) => void; getLabel: (v: string) => string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const q = query.toLowerCase();
  const filtered = query
    ? options.filter((o) => getLabel(o).toLowerCase().includes(q) || o.toLowerCase().includes(q))
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
              onMouseDown={() => { onChange(option); setQuery(getLabel(option)); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-hover ${value === option ? "text-fg font-medium" : "text-fg-muted"}`}
            >
              {getLabel(option)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Target calculation ─────────────────────────────────────────

const inScale = (v: number | null): v is number => v !== null && v >= 1 && v <= 6;
const scalePct = (v: number) => `${((Math.min(6, Math.max(1, v)) - 1) / 5) * 100}%`;

function ScaleMarker({ value, dotCls }: { value: number | null; dotCls: string }) {
  if (!inScale(value)) return null;
  return (
    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: scalePct(value) }}>
      <div className={`w-4 h-4 rounded-full ring-2 ring-surface shadow-sm ${dotCls}`} />
    </div>
  );
}

function GradeScaleBar({ currentAvg, needed }: { currentAvg: number | null; needed: number | null }) {
  const unreachable = needed !== null && needed > 6;

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
        <ScaleMarker value={currentAvg} dotCls="bg-ink" />
        <ScaleMarker value={needed} dotCls="bg-subject-green" />
      </div>
      <div className="flex gap-4 mt-1.5 text-xs flex-wrap">
        <span className="flex items-center gap-1.5 text-fg-muted">
          <span className="inline-block w-3 h-3 rounded-full bg-ink shrink-0" />
          Current avg: <span className="font-mono">{inScale(currentAvg) ? currentAvg.toFixed(2) : "—"}</span>
        </span>
        <span className={`flex items-center gap-1.5 ${unreachable ? "text-now" : "text-subject-green"}`}>
          <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${unreachable ? "bg-now" : "bg-subject-green"}`} />
          Needed: <span className="font-mono">{needed !== null && needed >= 1 ? needed.toFixed(2) : "—"}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Current weighted average of `grades`, and the grade needed on one more grade of
 * `weight` so the average rounds (to the half grade) to `target`.
 */
function targetCalc(grades: Grade[], target: number, weight: number) {
  const active = grades.filter((g) => g.weight > 0);
  const weightedSum = active.reduce((acc, g) => acc + g.value * g.weight, 0);
  const totalWeight = active.reduce((acc, g) => acc + g.weight, 0);
  const currentAvg = active.length > 0 ? weightedSum / totalWeight : null;

  const isHalfGrade = !isNaN(target) && Math.abs(target * 2 - Math.round(target * 2)) < 0.001;
  if (!isHalfGrade || isNaN(weight) || weight <= 0) return { currentAvg, needed: null };
  const roundedMin = target - 0.25;
  return { currentAvg, needed: (roundedMin * (totalWeight + weight) - weightedSum) / weight };
}

// ─── Paste parsing ──────────────────────────────────────────────

/** "DD.MM.YYYY" → "YYYY-MM-DD"; today when missing or malformed. */
function parseSwissDate(raw: string | undefined) {
  const parts = raw?.trim().split(".") ?? [];
  if (parts.length !== 3) return new Date().toISOString().split("T")[0];
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
}

const parseDecimal = (raw: string | undefined) => parseFloat(raw?.trim().replace(",", ".") ?? "");

function parsePastedLine(line: string): BulkGradeEntry[] {
  const fields = line.split("\t");
  if (fields.length < 2) return [];
  const value = parseDecimal(fields[1]);
  if (isNaN(value) || value < 1 || value > 6) return [];
  const weight = parseDecimal(fields[3]);
  return [{ description: fields[0].trim(), value, date: parseSwissDate(fields[2]), weight: isNaN(weight) ? 1 : weight }];
}

function parsePastedGrades(text: string): BulkGradeEntry[] {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .flatMap(parsePastedLine);
}

// ─── Per-school subject operations ──────────────────────────────

/** Grade/adjustment operations for one subject, routed to the KSH or BZZ variant. */
function useSubjectOps() {
  const d = useDashboard();
  const sem = d.activeSemester;
  if (d.activeSchool === "BZZ") {
    return {
      grades: d.getBzzModuleGrades,
      adjustment: d.getBzzModuleAdjustment,
      saveAdjustment: d.saveBzzAdjustment,
      add: d.addBzzGrade,
    };
  }
  return {
    grades: (s: string) => d.getGradesForSubject(sem, s),
    adjustment: (s: string) => d.getAdjustment(sem, s),
    saveAdjustment: (s: string, v: number) => d.saveAdjustment(sem, s, v),
    add: d.addGrade,
  };
}

// ─── Tabs ───────────────────────────────────────────────────────

type Tab = "add" | "paste" | "target";

/** All panes share one grid cell so the panel keeps the tallest pane's height. */
function TabPane({ active, className, children }: { active: boolean; className: string; children: ReactNode }) {
  return (
    <div className={`col-start-1 row-start-1 ${className} ${active ? "" : "invisible pointer-events-none"}`}>
      {children}
    </div>
  );
}

/** Bonus/malus input; keyed by subject so it re-reads the saved value on switch. */
function AdjustmentInput({ subject }: { subject: string }) {
  const ops = useSubjectOps();
  const adj = subject ? ops.adjustment(subject) : 0;
  const [adjInput, setAdjInput] = useState(adj !== 0 ? String(adj) : "");

  const commit = () => {
    if (!subject) return;
    const val = parseFloat(adjInput);
    ops.saveAdjustment(subject, isNaN(val) ? 0 : val);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-[11px] text-fg-faint shrink-0">Bonus/Malus</label>
      <input
        type="number" step="any" value={adjInput}
        onChange={(e) => setAdjInput(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { blockNonNumericKeys(e, { allowNegative: true }); if (e.key === "Enter") commit(); }}
        disabled={!subject}
        className={`w-20 text-center ${textInput} py-1 disabled:opacity-40 disabled:cursor-not-allowed`}
        placeholder="±0.0"
      />
    </div>
  );
}

function PointsInput({ myPoints, totalPoints, onChange }: { myPoints: string; totalPoints: string; onChange: (my: string, total: string) => void }) {
  const { gradeValue } = useDashboard();
  const cls = `w-24 h-9 text-center ${textInput}`;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input type="number" min="0" step="any" value={myPoints} onChange={(e) => onChange(e.target.value, totalPoints)} onKeyDown={(e) => blockNonNumericKeys(e)} className={cls} placeholder="My pts" />
      <span className="text-fg-faint text-sm">/</span>
      <input type="number" min="0" step="any" value={totalPoints} onChange={(e) => onChange(myPoints, e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className={cls} placeholder="Max pts" />
      {gradeValue && <span className={`inline-flex items-center justify-center px-3 h-9 rounded-control font-mono text-sm border ${getGradeColor(parseFloat(gradeValue))}`}>= {parseFloat(gradeValue).toFixed(3)}</span>}
    </div>
  );
}

const modeBtn = (active: boolean) =>
  `px-2.5 py-1 rounded-control transition cursor-pointer ${active ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"}`;

function AddTab({ subject, noSlider, active }: { subject: string; noSlider?: boolean; active: boolean }) {
  const {
    gradeValue, setGradeValue,
    gradeWeight, setGradeWeight,
    gradeDescription, setGradeDescription,
    gradeDate, setGradeDate,
    isSubmitting,
  } = useDashboard();
  const ops = useSubjectOps();
  const [inputMode, setInputMode] = useState<"grade" | "points">("grade");
  const [points, setPoints] = useState({ my: "", total: "" });

  const setPointsAndGrade = (my: string, total: string) => {
    setPoints({ my, total });
    setGradeValue(calcGradeFromPoints(my, total));
  };

  const parsedValue = parseFloat(gradeValue);
  const isAddDisabled = !subject || !gradeValue || parsedValue < 1 || parsedValue > 6;

  const handleAdd = async () => {
    if (!subject || !gradeValue) return;
    await ops.add(subject);
    setPoints({ my: "", total: "" });
  };

  return (
    <TabPane active={active} className="space-y-3">
      <AdjustmentInput key={subject} subject={subject} />
      <div className="flex rounded-control bg-sunken p-0.5 text-xs w-fit">
        <button type="button" onClick={() => setInputMode("grade")} className={modeBtn(inputMode === "grade")}>Grade</button>
        <button type="button" onClick={() => { setInputMode("points"); setPoints({ my: "", total: "" }); setGradeValue(""); }} className={modeBtn(inputMode === "points")}>Points</button>
      </div>
      <div>
        <label className={fieldLabel}>Grade</label>
        {inputMode === "grade" ? (
          <GradePicker value={gradeValue} onChange={setGradeValue} noSlider={noSlider} />
        ) : (
          <PointsInput myPoints={points.my} totalPoints={points.total} onChange={setPointsAndGrade} />
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
    </TabPane>
  );
}

function importLabel(count: number, importing: boolean) {
  if (importing) return "Importing…";
  if (count === 0) return "Import ";
  return `Import ${count} grade${count !== 1 ? "s" : ""}`;
}

function PasteTab({ subject, active }: { subject: string; active: boolean }) {
  const { bulkImportGrades } = useDashboard();
  const [pasteText, setPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const parsedGrades = pasteText ? parsePastedGrades(pasteText) : [];

  const handleImport = async () => {
    if (parsedGrades.length === 0 || isImporting || !subject) return;
    setIsImporting(true);
    await bulkImportGrades(subject, parsedGrades);
    setPasteText("");
    setIsImporting(false);
  };

  return (
    <TabPane active={active} className="flex flex-col gap-3">
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
      <Btn variant="primary" disabled={parsedGrades.length === 0 || isImporting || !subject} onClick={handleImport}>
        {importLabel(parsedGrades.length, isImporting)}
      </Btn>
    </TabPane>
  );
}

function TargetTab({ subject, noSlider, active }: { subject: string; noSlider?: boolean; active: boolean }) {
  const ops = useSubjectOps();
  const [targetAvg, setTargetAvg] = useState("4");
  const [targetWeight, setTargetWeight] = useState("1");

  const { currentAvg, needed } = targetCalc(
    subject ? ops.grades(subject) : [],
    parseFloat(targetAvg),
    parseFloat(targetWeight),
  );

  const snapTarget = (raw: string) => {
    const v = parseFloat(raw);
    if (!isNaN(v)) setTargetAvg(String(Math.min(6, Math.max(1, roundToHalf(v)))));
  };

  return (
    <TabPane active={active} className="flex flex-col gap-3">
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
            onBlur={(e) => snapTarget(e.target.value)}
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
        <GradeScaleBar currentAvg={subject ? currentAvg : null} needed={subject ? needed : null} />
      </div>
    </TabPane>
  );
}

// ─── Panel ──────────────────────────────────────────────────────

const tabBtn = (active: boolean) =>
  `w-16 py-1 rounded-control text-xs font-medium transition cursor-pointer text-center ${
    active ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg hover:bg-hover"
  }`;

const BZZ_OPTIONS: string[] = [...BZZ_NORMAL_MODULES, ...BZZ_UK_MODULES, BZZ_IPA];

function subjectLabel(isBzz: boolean) {
  const names = isBzz ? BZZ_MODULE_NAMES : KSH_SUBJECT_NAMES;
  return (v: string) => (names[v] ? `${v} – ${names[v]}` : v);
}

export default function AddGradePanel({ noSlider }: { noSlider?: boolean }) {
  const { activeSchool, activeSemester } = useDashboard();
  const [subject, setSubject] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("add");

  const isBzz = activeSchool === "BZZ";
  const subjectOptions: string[] = isBzz ? BZZ_OPTIONS : (SEMESTER_SUBJECTS[activeSemester] ?? []);

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
            value={subject}
            onChange={setSubject}
            getLabel={subjectLabel(isBzz)}
          />
        </div>

        <div className="px-4 pb-4 pt-3 grid">
          <AddTab subject={subject} noSlider={noSlider} active={activeTab === "add"} />
          <PasteTab subject={subject} active={activeTab === "paste"} />
          <TargetTab subject={subject} noSlider={noSlider} active={activeTab === "target"} />
        </div>
      </div>
    </div>
  );
}
