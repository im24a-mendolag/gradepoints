"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  SEMESTER_SUBJECTS,
  TOTAL_SEMESTERS,
  FINALS_SEMESTER,
  FINALS_ENTRIES,
  IDPA_FINAL_FOR_IDAF,
  OVERVIEW_SUBJECTS,
  BZZ_SEMESTER,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "@/lib/semesters";
import { Grade, Adjustment, SemesterStatus, OverviewStatus, FinalSubjectGrade, School, BzzPassFailStatus } from "./types";

// ─── Context shape ──────────────────────────────────────────────

interface DashboardContextType {
  // ── Core data ──
  grades: Grade[];
  activeSemester: number;
  activeSchool: School;
  setActiveSchool: (school: School) => void;
  error: string | null;
  loading: boolean;

  // ── UI state ──
  addingFor: string | null;
  editingGrade: string | null;
  expandedSubjects: Set<string>;
  editingAdjustment: string | null;

  // ── Grade form (add) ──
  gradeValue: string;
  gradeWeight: string;
  gradeDescription: string;
  gradeDate: string;
  setGradeValue: (v: string) => void;
  setGradeWeight: (v: string) => void;
  setGradeDescription: (v: string) => void;
  setGradeDate: (v: string) => void;

  // ── Grade form (edit) ──
  editValue: string;
  editWeight: string;
  editDescription: string;
  editDate: string;
  setEditValue: (v: string) => void;
  setEditWeight: (v: string) => void;
  setEditDescription: (v: string) => void;
  setEditDate: (v: string) => void;

  // ── Adjustment form ──
  adjustmentInput: string;
  setAdjustmentInput: (v: string) => void;

  // ── Finals form ──
  finalsInputs: Record<string, string>;

  // ── Actions ──
  selectSemester: (sem: number) => void;
  dismissError: () => void;

  // Grade CRUD
  addGrade: (subject: string) => Promise<void>;
  updateGrade: (id: string) => Promise<void>;
  deleteGrade: (id: string) => Promise<void>;

  // Finals CRUD
  saveFinalsGrade: (entry: string, value: string) => Promise<void>;
  deleteFinalsGrade: (entry: string) => Promise<void>;

  // Adjustment CRUD
  saveAdjustment: (semester: number, subject: string, value: number) => Promise<void>;

  // UI actions
  startAdding: (subject: string) => void;
  cancelAdding: () => void;
  startEditing: (grade: Grade) => void;
  cancelEditing: () => void;
  toggleExpand: (subject: string) => void;
  startEditingAdjustment: (semester: number, subject: string) => void;
  cancelEditingAdjustment: () => void;
  handleSaveAdjustment: (semester: number, subject: string) => void;
  startEditingFinals: (entry: string, currentGrade: Grade | null) => void;
  cancelEditingFinals: () => void;
  handleDeleteFinalsEntry: (entry: string) => void;
  onFinalsInputChange: (entry: string, value: string) => void;

  // ── Computed values ──
  getGradesForSubject: (semester: number, subject: string) => Grade[];
  getAdjustment: (semester: number, subject: string) => number;
  getRawSubjectAverage: (semester: number, subject: string) => number | null;
  getSubjectAverage: (semester: number, subject: string) => number | null;
  getSemesterAverage: (semester: number) => number | null;
  getFinalsAverage: () => number | null;
  getOverallAverage: () => number | null;
  getSemesterStatus: (semester: number) => SemesterStatus | null;
  getFinalsExamGrade: (subject: string) => number | null;
  getSemestersForSubject: (subject: string) => number[];
  getFinalSubjectGrade: (subject: string) => FinalSubjectGrade;
  getOverviewStatus: () => OverviewStatus | null;
  getFinalsInputValue: (entry: string) => string;

  // ── BZZ computed values ──
  getBzzModuleGrades: (mod: string) => Grade[];
  getBzzModuleAdjustment: (mod: string) => number;
  getBzzModuleRawAverage: (mod: string) => number | null;
  getBzzModuleAverage: (mod: string) => number | null;
  getBzzNormalAverage: () => number | null;
  getBzzUkAverage: () => number | null;
  getBzzFinalAverage: () => number | null;
  getBzzIpaAverage: () => number | null;
  getBzzPassFail: () => BzzPassFailStatus;

  // ── BZZ CRUD ──
  addBzzGrade: (mod: string) => Promise<void>;
  saveBzzAdjustment: (mod: string, value: number) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

/**
 * Hook to access the dashboard context.
 * Must be used within a DashboardProvider.
 * @returns The full DashboardContextType with state, actions, and computed values.
 */
export function useDashboard(): DashboardContextType {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────

export function DashboardProvider({ children, initialSchool = "KSH" }: { children: ReactNode; initialSchool?: School }) {
  // ── Core state ──
  const [grades, setGrades] = useState<Grade[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSemester, setActiveSemester] = useState(initialSchool === "KSH" ? 1 : BZZ_SEMESTER);
  const [activeSchool, setActiveSchoolState] = useState<School>(initialSchool);
  const [error, setError] = useState<string | null>(null);

  // ── Add-grade form ──
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [gradeWeight, setGradeWeight] = useState("1");
  const [gradeDescription, setGradeDescription] = useState("");
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split("T")[0]);

  // ── Edit-grade form ──
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editWeight, setEditWeight] = useState("1");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // ── UI state ──
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [editingAdjustment, setEditingAdjustment] = useState<string | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [finalsInputs, setFinalsInputs] = useState<Record<string, string>>({});

  // ─── Data fetching ────────────────────────────────────────────

  /** Fetches all grades for the current user from the API. */
  const fetchGrades = useCallback(async () => {
    try {
      const res = await fetch("/api/grades");
      if (res.ok) setGrades(await res.json());
    } catch (err) {
      console.error("Failed to fetch grades", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetches all bonus/malus adjustments for the current user from the API. */
  const fetchAdjustments = useCallback(async () => {
    try {
      const res = await fetch("/api/adjustments");
      if (res.ok) setAdjustments(await res.json());
    } catch (err) {
      console.error("Failed to fetch adjustments", err);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
    fetchAdjustments();
  }, [fetchGrades, fetchAdjustments]);

  // ── School-filtered data helpers ──
  const kshGrades = grades.filter((g) => !g.school || g.school === "KSH");
  const kshAdjustments = adjustments.filter((a) => !a.school || a.school === "KSH");
  const bzzGrades = grades.filter((g) => g.school === "BZZ");
  const bzzAdjustments = adjustments.filter((a) => a.school === "BZZ");

  /** Switches school and resets UI state. */
  const setActiveSchool = (school: School) => {
    setActiveSchoolState(school);
    setActiveSemester(school === "KSH" ? 1 : BZZ_SEMESTER);
    setAddingFor(null);
    setEditingGrade(null);
    setEditingAdjustment(null);
    setExpandedSubjects(new Set());
    setGradeValue("");
    setGradeWeight("1");
    setGradeDescription("");
    setGradeDate(new Date().toISOString().split("T")[0]);
    setEditValue("");
    setEditWeight("1");
    setEditDescription("");
    setEditDate("");
  };

  // ─── KSH Helpers / computed values ────────────────────────────

  /**
   * Filters KSH grades by semester and subject.
   */
  const getGradesForSubject = (semester: number, subject: string) =>
    kshGrades.filter((g) => g.semester === semester && g.subject === subject);

  /**
   * Looks up the KSH bonus/malus adjustment value for a subject in a semester.
   */
  const getAdjustment = (semester: number, subject: string): number => {
    const adj = kshAdjustments.find((a) => a.semester === semester && a.subject === subject);
    return adj ? adj.value : 0;
  };

  /**
   * Calculates the raw (non-rounded) weighted average for a subject,
   * including the bonus/malus adjustment, clamped to [1, 6].
   * @returns The raw average, or null if there are no counting grades.
   */
  const getRawSubjectAverage = (semester: number, subject: string) => {
    const subjectGrades = getGradesForSubject(semester, subject).filter((g) => g.weight > 0);
    if (subjectGrades.length === 0) return null;
    const totalWeight = subjectGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = subjectGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const adjustment = getAdjustment(semester, subject);
    return Math.min(6, Math.max(1, weightedSum / totalWeight + adjustment));
  };

  /**
   * Calculates the rounded weighted average for a subject (nearest 0.5), clamped to [1, 6].
   * @returns The rounded average, or null if no grades exist.
   */
  const getSubjectAverage = (semester: number, subject: string) => {
    const raw = getRawSubjectAverage(semester, subject);
    if (raw === null) return null;
    return Math.min(6, Math.max(1, Math.round(raw * 2) / 2));
  };

  /**
   * Averages all subject averages in a semester (not rounded).
   * @returns The semester average, or null if no subjects have grades.
   */
  const getSemesterAverage = (semester: number) => {
    const avgs = (SEMESTER_SUBJECTS[semester] ?? [])
      .map((s) => getSubjectAverage(semester, s))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  };

  /**
   * Averages all finals subject-group grades, rounded to 0.5.
   * Groups: German (Oral+Written), French, English, Math, WR, FrW.
   * @returns The finals average, or null if no finals grades exist.
   */
  const getFinalsAverage = () => {
    const groups = [
      { entries: ["German (Oral)", "German (Written)"] },
      { entries: ["French (Oral)", "French (Written)"] },
      { entries: ["English (Oral)", "English (Written)"] },
      { entries: ["Math (Written)"] },
      { entries: ["WR (Written)"] },
      { entries: ["FrW (Written)"] },
    ];
    const groupAvgs = groups
      .map(({ entries }) => {
        const vals = entries
          .map((e) => { const g = getGradesForSubject(FINALS_SEMESTER, e); return g.length > 0 ? g[0].value : null; })
          .filter((v): v is number => v !== null);
        if (vals.length === 0) return null;
        return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
      })
      .filter((a): a is number => a !== null);
    if (groupAvgs.length === 0) return null;
    return Math.round((groupAvgs.reduce((a, b) => a + b, 0) / groupAvgs.length) * 2) / 2;
  };

  /**
   * Calculates the overall average across semesters 1–6 and finals (not rounded).
   * @returns The overall average, or null if no data.
   */
  const getOverallAverage = () => {
    const semAvgs = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => getSemesterAverage(i + 1))
      .filter((a): a is number => a !== null);
    const finalsAvg = getFinalsAverage();
    const all = [...semAvgs, ...(finalsAvg !== null ? [finalsAvg] : [])];
    if (all.length === 0) return null;
    return all.reduce((a, b) => a + b, 0) / all.length;
  };

  /**
   * Evaluates pass/fail for a semester using three rules:
   * 1) Average ≥ 4.0  2) ≤ 2 subjects below 4  3) ≤ 2 negative points.
   * @returns SemesterStatus or null if no grades.
   */
  const getSemesterStatus = (semester: number): SemesterStatus | null => {
    const subjectAvgs = (SEMESTER_SUBJECTS[semester] ?? [])
      .map((s) => ({ subject: s as string, avg: getSubjectAverage(semester, s) }))
      .filter((s): s is { subject: string; avg: number } => s.avg !== null);
    if (subjectAvgs.length === 0) return null;

    const semAvg = getSemesterAverage(semester);
    const below4 = subjectAvgs.filter((s) => s.avg < 4);
    const negPts = subjectAvgs.reduce((acc, s) => (s.avg < 4 ? acc + (4 - s.avg) : acc), 0);
    const r1 = semAvg !== null && semAvg >= 4;
    const r2 = below4.length <= 2;
    const r3 = negPts <= 2;

    return {
      passed: r1 && r2 && r3,
      semAvg,
      subjectsBelow4: below4.map((s) => s.subject),
      subjectsBelow4Count: below4.length,
      negativePoints: Math.round(negPts * 10) / 10,
      rule1Pass: r1,
      rule2Pass: r2,
      rule3Pass: r3,
    };
  };

  /**
   * Gets the finals exam grade for a base subject by averaging its oral/written entries.
   * @returns The finals grade rounded to 0.5, or null.
   */
  const getFinalsExamGrade = (subject: string): number | null => {
    const entries = FINALS_ENTRIES[subject];
    if (!entries) return null;
    const vals = entries
      .map((e) => { const g = getGradesForSubject(FINALS_SEMESTER, e); return g.length > 0 ? g[0].value : null; })
      .filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 2) / 2;
  };

  /**
   * Lists which semesters (1–6) a subject appears in.
   * @returns Array of semester numbers.
   */
  const getSemestersForSubject = (subject: string): number[] => {
    const result: number[] = [];
    for (let s = 1; s <= TOTAL_SEMESTERS; s++) {
      if ((SEMESTER_SUBJECTS[s] ?? []).includes(subject as never)) result.push(s);
    }
    return result;
  };

  /**
   * Gets the IDPA grade (semester 6 average), used as the "final" for IDAF.
   * @returns The IDPA subject average, or null.
   */
  const getIdpaGrade = (): number | null =>
    getSubjectAverage(IDPA_FINAL_FOR_IDAF.finalSemester, IDPA_FINAL_FOR_IDAF.finalSubject);

  /**
   * Computes the final 3-year grade for a subject combining semester averages and finals.
   * For IDAF, uses the IDPA grade as the finals component.
   * @returns { semesterAvg, finalsGrade, finalGrade } (all nullable).
   */
  const getFinalSubjectGrade = (subject: string): FinalSubjectGrade => {
    const sems = getSemestersForSubject(subject);
    const semAvgs = sems.map((s) => getSubjectAverage(s, subject)).filter((a): a is number => a !== null);
    const semesterAvg = semAvgs.length > 0
      ? Math.round((semAvgs.reduce((a, b) => a + b, 0) / semAvgs.length) * 2) / 2
      : null;

    const finalsGrade = subject === IDPA_FINAL_FOR_IDAF.subject
      ? getIdpaGrade()
      : getFinalsExamGrade(subject);

    if (semesterAvg === null && finalsGrade === null) {
      return { semesterAvg: null, finalsGrade: null, finalGrade: null };
    }

    let finalGrade: number;
    if (semesterAvg !== null && finalsGrade !== null) {
      finalGrade = Math.round(((semesterAvg + finalsGrade) / 2) * 2) / 2;
    } else {
      finalGrade = (semesterAvg ?? finalsGrade)!;
    }

    return { semesterAvg, finalsGrade, finalGrade };
  };

  /**
   * Evaluates the 3-year pass/fail status using the same three rules as semesters.
   * @returns OverviewStatus or null if no data.
   */
  const getOverviewStatus = (): OverviewStatus | null => {
    const results = OVERVIEW_SUBJECTS
      .map((subject) => ({ subject, finalGrade: getFinalSubjectGrade(subject).finalGrade }))
      .filter((s): s is { subject: string; finalGrade: number } => s.finalGrade !== null);
    if (results.length === 0) return null;

    const avg = Math.round((results.reduce((a, s) => a + s.finalGrade, 0) / results.length) * 2) / 2;
    const below4 = results.filter((s) => s.finalGrade < 4);
    const negPts = results.reduce((a, s) => (s.finalGrade < 4 ? a + (4 - s.finalGrade) : a), 0);
    const r1 = avg >= 4;
    const r2 = below4.length <= 2;
    const r3 = negPts <= 2;

    return {
      passed: r1 && r2 && r3,
      avg,
      subjectResults: results,
      subjectsBelow4: below4.map((s) => s.subject),
      subjectsBelow4Count: below4.length,
      negativePoints: Math.round(negPts * 10) / 10,
      rule1Pass: r1,
      rule2Pass: r2,
      rule3Pass: r3,
    };
  };

  /**
   * Gets the current input value for a finals entry, falling back to the saved grade.
   * @returns The input string value.
   */
  const getFinalsInputValue = (entry: string) => {
    if (finalsInputs[entry] !== undefined) return finalsInputs[entry];
    const existing = getGradesForSubject(FINALS_SEMESTER, entry);
    return existing.length > 0 ? existing[0].value.toString() : "";
  };

  // ─── BZZ Helpers / computed values ──────────────────────────────

  /** Filters BZZ grades for a given module. */
  const getBzzModuleGrades = (mod: string) =>
    bzzGrades.filter((g) => g.semester === BZZ_SEMESTER && g.subject === mod);

  /** Looks up the BZZ adjustment for a module. */
  const getBzzModuleAdjustment = (mod: string): number => {
    const adj = bzzAdjustments.find((a) => a.semester === BZZ_SEMESTER && a.subject === mod);
    return adj ? adj.value : 0;
  };

  /** Raw (non-rounded) weighted average for a BZZ module, with bonus/malus, clamped [1,6]. */
  const getBzzModuleRawAverage = (mod: string): number | null => {
    const modGrades = getBzzModuleGrades(mod).filter((g) => g.weight > 0);
    if (modGrades.length === 0) return null;
    const totalWeight = modGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = modGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const adjustment = getBzzModuleAdjustment(mod);
    return Math.min(6, Math.max(1, weightedSum / totalWeight + adjustment));
  };

  /** Rounded (0.5) weighted average for a BZZ module. */
  const getBzzModuleAverage = (mod: string): number | null => {
    const raw = getBzzModuleRawAverage(mod);
    if (raw === null) return null;
    return Math.min(6, Math.max(1, Math.round(raw * 2) / 2));
  };

  /** Average of all normal module averages, rounded to 0.5. */
  const getBzzNormalAverage = (): number | null => {
    const avgs = (BZZ_NORMAL_MODULES as readonly string[])
      .map((m) => getBzzModuleAverage(m))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 2) / 2;
  };

  /** Average of all ÜK module averages, rounded to 0.5. */
  const getBzzUkAverage = (): number | null => {
    const avgs = (BZZ_UK_MODULES as readonly string[])
      .map((m) => getBzzModuleAverage(m))
      .filter((a): a is number => a !== null);
    if (avgs.length === 0) return null;
    return Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 2) / 2;
  };

  /** Final average: mean of the rounded Normal avg and rounded ÜK avg. Result is NOT additionally rounded. */
  const getBzzFinalAverage = (): number | null => {
    const normalAvg = getBzzNormalAverage();
    const ukAvg = getBzzUkAverage();
    if (normalAvg === null && ukAvg === null) return null;
    if (normalAvg !== null && ukAvg !== null) return (normalAvg + ukAvg) / 2;
    return normalAvg ?? ukAvg;
  };

  /** IPA grade: raw weighted average, NOT rounded. */
  const getBzzIpaAverage = (): number | null => {
    const ipaGrades = getBzzModuleGrades(BZZ_IPA).filter((g) => g.weight > 0);
    if (ipaGrades.length === 0) return null;
    const totalWeight = ipaGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = ipaGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const adjustment = getBzzModuleAdjustment(BZZ_IPA);
    return Math.min(6, Math.max(1, weightedSum / totalWeight + adjustment));
  };

  /** BZZ pass/fail status. */
  const getBzzPassFail = (): BzzPassFailStatus => {
    const normalAvg = getBzzNormalAverage();
    const ukAvg = getBzzUkAverage();
    const finalAvg = getBzzFinalAverage();
    const ipaGrade = getBzzIpaAverage();
    const ipaPass = ipaGrade !== null ? ipaGrade >= 4 : null;
    const avgPass = finalAvg !== null ? finalAvg >= 4 : null;
    const passed = avgPass === true && (ipaPass === true || ipaPass === null);
    return { passed, normalAvg, ukAvg, finalAvg, ipaGrade, ipaPass };
  };

  // ─── CRUD actions ─────────────────────────────────────────────

  /**
   * Creates a new grade for the given subject in the active semester (KSH).
   * Reads values from the add-grade form state.
   */
  const addGrade = async (subject: string) => {
    if (!gradeValue) return;
    setError(null);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(gradeValue),
          weight: parseFloat(gradeWeight),
          description: gradeDescription,
          date: gradeDate,
          semester: activeSemester,
          subject,
        }),
      });
      if (res.ok) {
        setAddingFor(null);
        setGradeValue("");
        setGradeWeight("1");
        setGradeDescription("");
        setGradeDate(new Date().toISOString().split("T")[0]);
        fetchGrades();
      } else {
        setError((await res.json()).error || "Failed to add grade");
      }
    } catch {
      setError("Failed to add grade. Please try again.");
    }
  };

  /** Deletes a grade by ID. */
  const deleteGrade = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      if (res.ok) fetchGrades();
      else setError((await res.json()).error || "Failed to delete grade");
    } catch {
      setError("Failed to delete grade. Please try again.");
    }
  };

  /** Updates a grade by ID using the edit-form state. */
  const updateGrade = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/grades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(editValue),
          weight: parseFloat(editWeight),
          description: editDescription,
          date: editDate,
        }),
      });
      if (res.ok) { setEditingGrade(null); fetchGrades(); }
      else setError((await res.json()).error || "Failed to update grade");
    } catch {
      setError("Failed to update grade. Please try again.");
    }
  };

  /** Creates or updates a single finals grade for an entry. */
  const saveFinalsGrade = async (subject: string, value: string) => {
    if (!value) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 1 || numVal > 6) return;
    setError(null);

    const existing = getGradesForSubject(FINALS_SEMESTER, subject);
    try {
      if (existing.length > 0) {
        const res = await fetch(`/api/grades/${existing[0].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: numVal }),
        });
        if (!res.ok) { setError((await res.json()).error || "Failed to update finals grade"); return; }
      } else {
        const res = await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: numVal, weight: 1, description: "", semester: FINALS_SEMESTER, subject }),
        });
        if (!res.ok) { setError((await res.json()).error || "Failed to add finals grade"); return; }
      }
      await fetchGrades();
      setFinalsInputs((prev) => { const next = { ...prev }; delete next[subject]; return next; });
    } catch {
      setError("Failed to save finals grade. Please try again.");
    }
  };

  /** Deletes the finals grade for a given entry. */
  const deleteFinalsGradeAction = async (subject: string) => {
    const existing = getGradesForSubject(FINALS_SEMESTER, subject);
    if (existing.length > 0) await deleteGrade(existing[0].id);
  };

  /** Creates, updates, or deletes a bonus/malus adjustment (0 = delete). KSH. */
  const saveAdjustmentAction = async (semester: number, subject: string, value: number) => {
    setError(null);
    try {
      if (value === 0) {
        await fetch("/api/adjustments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester, subject, school: "KSH" }),
        });
      } else {
        const res = await fetch("/api/adjustments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, semester, subject, school: "KSH" }),
        });
        if (!res.ok) { setError((await res.json()).error || "Failed to save adjustment"); return; }
      }
      await fetchAdjustments();
    } catch {
      setError("Failed to save adjustment. Please try again.");
    }
  };

  /** Creates a new BZZ grade for a module. */
  const addBzzGrade = async (mod: string) => {
    if (!gradeValue) return;
    setError(null);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(gradeValue),
          weight: parseFloat(gradeWeight),
          description: gradeDescription,
          date: gradeDate,
          semester: BZZ_SEMESTER,
          subject: mod,
          school: "BZZ",
        }),
      });
      if (res.ok) {
        setAddingFor(null);
        setGradeValue("");
        setGradeWeight("1");
        setGradeDescription("");
        setGradeDate(new Date().toISOString().split("T")[0]);
        fetchGrades();
      } else {
        setError((await res.json()).error || "Failed to add grade");
      }
    } catch {
      setError("Failed to add grade. Please try again.");
    }
  };

  /** Creates, updates, or deletes a BZZ adjustment (0 = delete). */
  const saveBzzAdjustment = async (mod: string, value: number) => {
    setError(null);
    try {
      if (value === 0) {
        await fetch("/api/adjustments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester: BZZ_SEMESTER, subject: mod, school: "BZZ" }),
        });
      } else {
        const res = await fetch("/api/adjustments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, semester: BZZ_SEMESTER, subject: mod, school: "BZZ" }),
        });
        if (!res.ok) { setError((await res.json()).error || "Failed to save adjustment"); return; }
      }
      await fetchAdjustments();
    } catch {
      setError("Failed to save adjustment. Please try again.");
    }
  };

  // ─── UI actions ───────────────────────────────────────────────

  /** Switches to a different tab and resets active forms. */
  const selectSemester = (sem: number) => {
    setActiveSemester(sem);
    setAddingFor(null);
    setEditingGrade(null);
  };

  /** Opens the add-grade form for a subject, expanding it and resetting fields. */
  const startAdding = (subject: string) => {
    if (addingFor === subject) {
      setAddingFor(null);
    } else {
      setAddingFor(subject);
      setExpandedSubjects((prev) => new Set(prev).add(subject));
      setGradeValue("");
      setGradeWeight("1");
      setGradeDescription("");
      setGradeDate(new Date().toISOString().split("T")[0]);
    }
  };

  /** Closes the add-grade form. */
  const cancelAdding = () => setAddingFor(null);

  /** Opens the edit form for an existing grade, pre-filling the fields. */
  const startEditing = (grade: Grade) => {
    setEditingGrade(grade.id);
    setEditValue(grade.value.toString());
    setEditWeight(grade.weight.toString());
    setEditDescription(grade.description);
    setEditDate(new Date(grade.date).toISOString().split("T")[0]);
  };

  /** Closes the edit-grade form. */
  const cancelEditing = () => setEditingGrade(null);

  /** Toggles the expanded/collapsed state of a subject's grade list. */
  const toggleExpand = (subject: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) {
        next.delete(subject);
        if (addingFor === subject) setAddingFor(null);
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  /** Opens the adjustment input for a subject, pre-filling with the current value. */
  const startEditingAdjustment = (semester: number, subject: string) => {
    const adj = getAdjustment(semester, subject);
    setEditingAdjustment(`${semester}-${subject}`);
    setAdjustmentInput(adj !== 0 ? adj.toString() : "");
  };

  /** Closes the adjustment input. */
  const cancelEditingAdjustment = () => setEditingAdjustment(null);

  /** Saves the current adjustment input and closes the form. */
  const handleSaveAdjustment = (semester: number, subject: string) => {
    const val = parseFloat(adjustmentInput);
    saveAdjustmentAction(semester, subject, isNaN(val) ? 0 : val);
    setEditingAdjustment(null);
  };

  /** Opens the edit form for a finals entry, pre-filling with the current grade. */
  const startEditingFinals = (entry: string, currentGrade: Grade | null) => {
    setEditingGrade(`finals-${entry}`);
    setFinalsInputs((prev) => ({
      ...prev,
      [entry]: currentGrade ? currentGrade.value.toString() : "",
    }));
  };

  /** Closes the finals edit form. */
  const cancelEditingFinals = () => {
    setEditingGrade(null);
  };

  /** Deletes a finals grade and clears its input. */
  const handleDeleteFinalsEntry = (entry: string) => {
    setFinalsInputs((prev) => { const next = { ...prev }; delete next[entry]; return next; });
    deleteFinalsGradeAction(entry);
  };

  /** Updates a controlled finals input value. */
  const onFinalsInputChange = (entry: string, value: string) => {
    setFinalsInputs((prev) => ({ ...prev, [entry]: value }));
  };

  // ─── Context value ────────────────────────────────────────────

  const value: DashboardContextType = {
    grades,
    activeSemester,
    activeSchool,
    setActiveSchool,
    error,
    loading,
    addingFor,
    editingGrade,
    expandedSubjects,
    editingAdjustment,
    gradeValue, gradeWeight, gradeDescription, gradeDate,
    setGradeValue, setGradeWeight, setGradeDescription, setGradeDate,
    editValue, editWeight, editDescription, editDate,
    setEditValue, setEditWeight, setEditDescription, setEditDate,
    adjustmentInput, setAdjustmentInput,
    finalsInputs,
    selectSemester,
    dismissError: () => setError(null),
    addGrade, updateGrade, deleteGrade,
    saveFinalsGrade,
    deleteFinalsGrade: deleteFinalsGradeAction,
    saveAdjustment: saveAdjustmentAction,
    startAdding, cancelAdding,
    startEditing, cancelEditing,
    toggleExpand,
    startEditingAdjustment, cancelEditingAdjustment, handleSaveAdjustment,
    startEditingFinals, cancelEditingFinals, handleDeleteFinalsEntry, onFinalsInputChange,
    getGradesForSubject, getAdjustment,
    getRawSubjectAverage, getSubjectAverage,
    getSemesterAverage, getFinalsAverage, getOverallAverage,
    getSemesterStatus, getFinalsExamGrade, getSemestersForSubject,
    getFinalSubjectGrade, getOverviewStatus, getFinalsInputValue,
    // BZZ
    getBzzModuleGrades, getBzzModuleAdjustment,
    getBzzModuleRawAverage, getBzzModuleAverage,
    getBzzNormalAverage, getBzzUkAverage, getBzzFinalAverage, getBzzIpaAverage,
    getBzzPassFail,
    addBzzGrade, saveBzzAdjustment,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
