"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from "react";
import {
  FINALS_SEMESTER,
  OVERVIEW_TAB,
  BZZ_SEMESTER,
} from "@/lib/semesters";
import { Grade, Adjustment, SemesterStatus, OverviewStatus, FinalSubjectGrade, School, BzzPassFailStatus } from "./types";
import { makeKshComputations } from "./lib/kshComputations";
import { makeBzzComputations } from "./lib/bzzComputations";

// ─── Context shape ──────────────────────────────────────────────

interface DashboardContextType {
  // ── Core data ──
  grades: Grade[];
  activeSemester: number;
  lastRegularSemester: number;
  activeSchool: School;
  setActiveSchool: (school: School) => void;
  error: string | null;
  loading: boolean;
  isSubmitting: boolean;

  // ── UI state ──
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

  // ── Bulk import ──
  bulkImportGrades: (subject: string, entries: BulkGradeEntry[]) => Promise<void>;

  // ── Undo ──
  undoEntry: { label: string } | null;
  undoLastAction: () => Promise<void>;
  dismissUndo: () => void;
}

export interface BulkGradeEntry {
  value: number;
  weight: number;
  description: string;
  date: string; // YYYY-MM-DD
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard(): DashboardContextType {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────

export function DashboardProvider({ children, initialSchool = "KSH", initialSemester }: { children: ReactNode; initialSchool?: School; initialSemester?: number }) {
  // ── Core state ──
  const [grades, setGrades] = useState<Grade[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSemester, setActiveSemester] = useState(initialSemester ?? (initialSchool === "KSH" ? 1 : BZZ_SEMESTER));
  const [lastRegularSemester, setLastRegularSemester] = useState(initialSchool === "KSH" ? 1 : BZZ_SEMESTER);
  const [activeSchool, setActiveSchoolState] = useState<School>(initialSchool);
  const [error, setError] = useState<string | null>(null);

  // ── Add-grade form ──
  const [gradeValue, setGradeValue] = useState("");
  const [gradeWeight, setGradeWeight] = useState("1");
  const [gradeDescription, setGradeDescription] = useState("");
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split("T")[0]);

  // Persists add-form state per school so switching KSH↔BZZ doesn't discard typed input.
  const savedForm = useRef<Record<School, { gradeValue: string; gradeWeight: string; gradeDescription: string; gradeDate: string }>>({
    KSH: { gradeValue: "", gradeWeight: "1", gradeDescription: "", gradeDate: new Date().toISOString().split("T")[0] },
    BZZ: { gradeValue: "", gradeWeight: "1", gradeDescription: "", gradeDate: new Date().toISOString().split("T")[0] },
  });

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

  // ── Undo ──
  const [undoAction, setUndoAction] = useState<{ label: string; perform: () => Promise<void> } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const pushUndo = (label: string, perform: () => Promise<void>) => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoAction({ label, perform });
    undoTimer.current = setTimeout(() => setUndoAction(null), 8000);
  };

  const undoLastAction = async () => {
    if (!undoAction) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const action = undoAction;
    setUndoAction(null);
    setIsSubmitting(true);
    try {
      await action.perform();
    } catch {
      setError("Failed to undo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissUndo = () => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoAction(null);
  };

  // ─── Data fetching ────────────────────────────────────────────

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

  // ── School-filtered data (memoized — only recompute when source arrays change) ──
  const kshGrades = useMemo(() => grades.filter((g) => !g.school || g.school === "KSH"), [grades]);
  const kshAdjustments = useMemo(() => adjustments.filter((a) => !a.school || a.school === "KSH"), [adjustments]);
  const bzzGrades = useMemo(() => grades.filter((g) => g.school === "BZZ"), [grades]);
  const bzzAdjustments = useMemo(() => adjustments.filter((a) => a.school === "BZZ"), [adjustments]);

  // ── Computation factories (memoized — only recompute when data or finalsInputs change) ──
  const ksh = useMemo(
    () => makeKshComputations(kshGrades, kshAdjustments, finalsInputs),
    [kshGrades, kshAdjustments, finalsInputs]
  );

  const bzz = useMemo(
    () => makeBzzComputations(bzzGrades, bzzAdjustments),
    [bzzGrades, bzzAdjustments]
  );

  /** Switches school, saving/restoring the add-form state per school. */
  const setActiveSchool = (school: School) => {
    // Save current school's add-form state before switching
    savedForm.current[activeSchool] = { gradeValue, gradeWeight, gradeDescription, gradeDate };

    // Restore the new school's previously saved add-form state
    const { gradeValue: v, gradeWeight: w, gradeDescription: d, gradeDate: dt } = savedForm.current[school];
    setGradeValue(v);
    setGradeWeight(w);
    setGradeDescription(d);
    setGradeDate(dt);

    setActiveSchoolState(school);
    setActiveSemester(school === "KSH" ? 1 : BZZ_SEMESTER);
    setEditingGrade(null);
    setEditingAdjustment(null);
    setExpandedSubjects(new Set());
    setEditValue("");
    setEditWeight("1");
    setEditDescription("");
    setEditDate("");
  };

  // ─── CRUD actions ─────────────────────────────────────────────

  const addGrade = async (subject: string) => {
    const parsedValue = parseFloat(gradeValue);
    const parsedWeight = parseFloat(gradeWeight);
    if (!gradeValue || isNaN(parsedValue) || isNaN(parsedWeight)) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parsedValue,
          weight: parsedWeight,
          description: gradeDescription,
          date: gradeDate,
          semester: activeSemester,
          subject,
        }),
      });
      if (res.ok) {
        const created: Grade = await res.json();
        setGradeValue("");
        setGradeWeight("1");
        setGradeDescription("");
        setGradeDate(new Date().toISOString().split("T")[0]);
        setExpandedSubjects((prev) => new Set(prev).add(subject));
        pushUndo("Grade added", async () => {
          await fetch(`/api/grades/${created.id}`, { method: "DELETE" });
          await fetchGrades();
        });
        await fetchGrades();
      } else {
        setError((await res.json()).error || "Failed to add grade");
      }
    } catch {
      setError("Failed to add grade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteGrade = async (id: string) => {
    const snapshot = grades.find((g) => g.id === id);
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchGrades();
        if (snapshot) {
          pushUndo("Grade deleted", async () => {
            await fetch("/api/grades", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                value: snapshot.value,
                weight: snapshot.weight,
                description: snapshot.description,
                date: new Date(snapshot.date).toISOString().split("T")[0],
                semester: snapshot.semester,
                subject: snapshot.subject,
                ...(snapshot.school !== "KSH" ? { school: snapshot.school } : {}),
              }),
            });
            await fetchGrades();
          });
        }
      } else {
        setError((await res.json()).error || "Failed to delete grade");
      }
    } catch {
      setError("Failed to delete grade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateGrade = async (id: string) => {
    const parsedValue = parseFloat(editValue);
    const parsedWeight = parseFloat(editWeight);
    if (isNaN(parsedValue) || isNaN(parsedWeight)) {
      setError("Grade value and weight must be valid numbers");
      return;
    }
    const snapshot = grades.find((g) => g.id === id);
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/grades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parsedValue,
          weight: parsedWeight,
          description: editDescription,
          date: editDate,
        }),
      });
      if (res.ok) {
        setEditingGrade(null);
        await fetchGrades();
        if (snapshot) {
          pushUndo("Grade updated", async () => {
            await fetch(`/api/grades/${id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                value: snapshot.value,
                weight: snapshot.weight,
                description: snapshot.description,
                date: new Date(snapshot.date).toISOString().split("T")[0],
              }),
            });
            await fetchGrades();
          });
        }
      } else {
        setError((await res.json()).error || "Failed to update grade");
      }
    } catch {
      setError("Failed to update grade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFinalsGrade = async (subject: string, value: string) => {
    if (!value) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 1 || numVal > 6) return;
    setError(null);
    setIsSubmitting(true);

    const existing = ksh.getGradesForSubject(FINALS_SEMESTER, subject);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteFinalsGradeAction = async (subject: string) => {
    const existing = ksh.getGradesForSubject(FINALS_SEMESTER, subject);
    if (existing.length > 0) await deleteGrade(existing[0].id);
  };

  const saveAdjustmentAction = async (semester: number, subject: string, value: number) => {
    setError(null);
    try {
      if (value === 0) {
        const res = await fetch("/api/adjustments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester, subject, school: "KSH" }),
        });
        if (!res.ok) { setError("Failed to delete adjustment"); return; }
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

  const addBzzGrade = async (mod: string) => {
    const parsedValue = parseFloat(gradeValue);
    const parsedWeight = parseFloat(gradeWeight);
    if (!gradeValue || isNaN(parsedValue) || isNaN(parsedWeight)) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/grades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parsedValue,
          weight: parsedWeight,
          description: gradeDescription,
          date: gradeDate,
          semester: BZZ_SEMESTER,
          subject: mod,
          school: "BZZ",
        }),
      });
      if (res.ok) {
        const created: Grade = await res.json();
        setGradeValue("");
        setGradeWeight("1");
        setGradeDescription("");
        setGradeDate(new Date().toISOString().split("T")[0]);
        setExpandedSubjects((prev) => new Set(prev).add(`bzz-${mod}`));
        pushUndo("Grade added", async () => {
          await fetch(`/api/grades/${created.id}`, { method: "DELETE" });
          await fetchGrades();
        });
        await fetchGrades();
      } else {
        setError((await res.json()).error || "Failed to add grade");
      }
    } catch {
      setError("Failed to add grade. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveBzzAdjustment = async (mod: string, value: number) => {
    setError(null);
    try {
      if (value === 0) {
        const res = await fetch("/api/adjustments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester: BZZ_SEMESTER, subject: mod, school: "BZZ" }),
        });
        if (!res.ok) { setError("Failed to delete adjustment"); return; }
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

  const bulkImportGrades = async (subject: string, entries: BulkGradeEntry[]) => {
    setError(null);
    const isBzz = activeSchool === "BZZ";
    const createdIds: string[] = [];
    try {
      for (const entry of entries) {
        const res = await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: entry.value,
            weight: entry.weight,
            description: entry.description,
            date: entry.date,
            semester: isBzz ? BZZ_SEMESTER : activeSemester,
            subject,
            ...(isBzz ? { school: "BZZ" } : {}),
          }),
        });
        if (!res.ok) {
          setError((await res.json()).error || "Failed to import a grade");
          break;
        }
        const created: Grade = await res.json();
        createdIds.push(created.id);
      }
      await fetchGrades();
      if (createdIds.length > 0) {
        pushUndo(
          `Pasted ${createdIds.length} grade${createdIds.length !== 1 ? "s" : ""}`,
          async () => {
            await Promise.all(createdIds.map((id) => fetch(`/api/grades/${id}`, { method: "DELETE" })));
            await fetchGrades();
          }
        );
      }
    } catch {
      setError("Failed to import grades. Please try again.");
    }
  };

  // ─── UI actions ───────────────────────────────────────────────

  const selectSemester = (sem: number) => {
    setActiveSemester(sem);
    setEditingGrade(null);
    if (sem !== OVERVIEW_TAB && sem !== FINALS_SEMESTER) {
      setLastRegularSemester(sem);
    }
  };

  const startEditing = (grade: Grade) => {
    setEditingGrade(grade.id);
    setEditValue(grade.value.toString());
    setEditWeight(grade.weight.toString());
    setEditDescription(grade.description);
    setEditDate(new Date(grade.date).toISOString().split("T")[0]);
  };

  const cancelEditing = () => setEditingGrade(null);

  const toggleExpand = (subject: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) next.delete(subject);
      else next.add(subject);
      return next;
    });
  };

  const startEditingAdjustment = (semester: number, subject: string) => {
    const adj = ksh.getAdjustment(semester, subject);
    setEditingAdjustment(`${semester}-${subject}`);
    setAdjustmentInput(adj !== 0 ? adj.toString() : "");
  };

  const cancelEditingAdjustment = () => setEditingAdjustment(null);

  const handleSaveAdjustment = (semester: number, subject: string) => {
    const val = parseFloat(adjustmentInput);
    saveAdjustmentAction(semester, subject, isNaN(val) ? 0 : val);
    setEditingAdjustment(null);
  };

  const startEditingFinals = (entry: string, currentGrade: Grade | null) => {
    setEditingGrade(`finals-${entry}`);
    setFinalsInputs((prev) => ({
      ...prev,
      [entry]: currentGrade ? currentGrade.value.toString() : "",
    }));
  };

  const cancelEditingFinals = () => setEditingGrade(null);

  const handleDeleteFinalsEntry = (entry: string) => {
    setFinalsInputs((prev) => { const next = { ...prev }; delete next[entry]; return next; });
    deleteFinalsGradeAction(entry);
  };

  const onFinalsInputChange = (entry: string, value: string) => {
    setFinalsInputs((prev) => ({ ...prev, [entry]: value }));
  };

  // ─── Context value ────────────────────────────────────────────

  const value: DashboardContextType = {
    grades,
    activeSemester,
    lastRegularSemester,
    activeSchool,
    setActiveSchool,
    error,
    loading,
    isSubmitting,
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
    startEditing, cancelEditing,
    toggleExpand,
    startEditingAdjustment, cancelEditingAdjustment, handleSaveAdjustment,
    startEditingFinals, cancelEditingFinals, handleDeleteFinalsEntry, onFinalsInputChange,
    // KSH computed
    ...ksh,
    // BZZ computed
    ...bzz,
    addBzzGrade, saveBzzAdjustment,
    bulkImportGrades,
    undoEntry: undoAction ? { label: undoAction.label } : null,
    undoLastAction,
    dismissUndo,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
