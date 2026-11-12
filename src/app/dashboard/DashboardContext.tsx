"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  FINALS_SEMESTER,
  OVERVIEW_TAB,
  BZZ_SEMESTER,
} from "@/lib/semesters";
import { Grade, SemesterStatus, OverviewStatus, FinalSubjectGrade, School, BzzPassFailStatus } from "./types";
import { useAddForm, useAutoSelectSemester, useEditForm, useGradeData, useSchoolComputations, useSubmitting, useUndo } from "./lib/dashboardHooks";
import { adjustmentsApi, apiError, gradeFields, gradesApi, recreateBody } from "./lib/gradesApi";

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
  getBzzNormalRawAverage: () => number | null;
  getBzzNormalAverage: () => number | null;
  getBzzUkRawAverage: () => number | null;
  getBzzUkAverage: () => number | null;
  getBzzFinalAverage: () => number | null;
  getBzzIpaAverage: () => number | null;
  getBzzPassFail: () => BzzPassFailStatus;

  // ── BZZ CRUD ──
  addBzzGrade: (mod: string) => Promise<void>;
  saveBzzAdjustment: (mod: string, value: number) => Promise<void>;

  // ── Bulk import ──
  bulkImportGrades: (subject: string, entries: BulkGradeEntry[]) => Promise<void>;

  // ── Clear semester ──
  clearSemesterGrades: (semester: number) => Promise<void>;

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

/** First tab to show for a school. */
const firstSemester = (school: School) => (school === "KSH" ? 1 : BZZ_SEMESTER);

/** Regular semester tabs (not Overview / Finals) are remembered as the last one visited. */
const isRegularSemester = (sem: number) => sem !== OVERVIEW_TAB && sem !== FINALS_SEMESTER;

/** Semester "Dashboard" returns to: a deep-linked regular tab (?tab=3), else the school's first. */
const initialRegularSemester = (school: School, deepLinked?: number) =>
  deepLinked !== undefined && isRegularSemester(deepLinked) ? deepLinked : firstSemester(school);

/** Parses a number input, treating blank/invalid as 0. */
const parseOrZero = (raw: string) => {
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : val;
};

export function DashboardProvider({ children, initialSchool = "KSH", initialSemester }: { children: ReactNode; initialSchool?: School; initialSemester?: number }) {
  // ── Core state ──
  const { grades, adjustments, loading, fetchGrades, fetchAdjustments } = useGradeData();
  const [activeSemester, setActiveSemester] = useState(initialSemester ?? firstSemester(initialSchool));
  const [lastRegularSemester, setLastRegularSemester] = useState(initialRegularSemester(initialSchool, initialSemester));
  const [activeSchool, setActiveSchoolState] = useState<School>(initialSchool);
  const { isSubmitting, error, setError, submitting } = useSubmitting();

  // ── Forms ──
  const addForm = useAddForm();
  const { gradeValue, gradeWeight, gradeDescription, gradeDate, resetAddForm } = addForm;
  const editForm = useEditForm();
  const { setEditingGrade, editValue, editWeight, editDescription, editDate } = editForm;

  // ── UI state ──
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [editingAdjustment, setEditingAdjustment] = useState<string | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState("");
  const [finalsInputs, setFinalsInputs] = useState<Record<string, string>>({});

  const { undoEntry, pushUndo, undoLastAction, dismissUndo } = useUndo(submitting);

  useAutoSelectSemester({ loading, grades, initialSemester, initialSchool }, (latest) => {
    setActiveSemester(latest);
    setLastRegularSemester(latest);
  });

  const { ksh, bzz } = useSchoolComputations(grades, adjustments, finalsInputs);

  /** Switches school, saving/restoring the add-form state per school. */
  const setActiveSchool = (school: School) => {
    addForm.swapSchool(activeSchool, school);
    setActiveSchoolState(school);
    setActiveSemester(firstSemester(school));
    editForm.resetEditForm();
    setEditingAdjustment(null);
    setExpandedSubjects(new Set());
  };

  // ─── CRUD actions ─────────────────────────────────────────────

  const _addGrade = async (bodyExtras: object, expandKey: string) => {
    const parsedValue = parseFloat(gradeValue);
    const parsedWeight = parseFloat(gradeWeight);
    if (!gradeValue || isNaN(parsedValue) || isNaN(parsedWeight)) return;
    const body = { value: parsedValue, weight: parsedWeight, description: gradeDescription, date: gradeDate, ...bodyExtras };
    await submitting("Failed to add grade. Please try again.", async () => {
      const res = await gradesApi.create(body);
      if (!res.ok) return setError(await apiError(res, "Failed to add grade"));
      const created: Grade = await res.json();
      resetAddForm();
      setExpandedSubjects((prev) => new Set(prev).add(expandKey));
      pushUndo("Grade added", async () => {
        await gradesApi.remove(created.id);
        await fetchGrades();
      });
      await fetchGrades();
    });
  };

  const addGrade = (subject: string) =>
    _addGrade({ semester: activeSemester, subject }, subject);

  const deleteGrade = async (id: string) => {
    const snapshot = grades.find((g) => g.id === id);
    await submitting("Failed to delete grade. Please try again.", async () => {
      const res = await gradesApi.remove(id);
      if (!res.ok) return setError(await apiError(res, "Failed to delete grade"));
      await fetchGrades();
      if (!snapshot) return;
      pushUndo("Grade deleted", async () => {
        await gradesApi.create(recreateBody(snapshot));
        await fetchGrades();
      });
    });
  };

  const updateGrade = async (id: string) => {
    const parsedValue = parseFloat(editValue);
    const parsedWeight = parseFloat(editWeight);
    if (isNaN(parsedValue) || isNaN(parsedWeight)) {
      setError("Grade value and weight must be valid numbers");
      return;
    }
    const snapshot = grades.find((g) => g.id === id);
    await submitting("Failed to update grade. Please try again.", async () => {
      const res = await gradesApi.update(id, {
        value: parsedValue,
        weight: parsedWeight,
        description: editDescription,
        date: editDate,
      });
      if (!res.ok) return setError(await apiError(res, "Failed to update grade"));
      setEditingGrade(null);
      await fetchGrades();
      if (!snapshot) return;
      pushUndo("Grade updated", async () => {
        await gradesApi.update(id, gradeFields(snapshot));
        await fetchGrades();
      });
    });
  };

  const saveFinalsGrade = async (subject: string, value: string) => {
    if (!value) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 1 || numVal > 6) return;

    const existing = ksh.getGradesForSubject(FINALS_SEMESTER, subject)[0];
    await submitting("Failed to save finals grade. Please try again.", async () => {
      const res = existing
        ? await gradesApi.update(existing.id, { value: numVal })
        : await gradesApi.create({ value: numVal, weight: 1, description: "", semester: FINALS_SEMESTER, subject });
      if (!res.ok) {
        return setError(await apiError(res, existing ? "Failed to update finals grade" : "Failed to add finals grade"));
      }
      await fetchGrades();
      setFinalsInputs((prev) => { const next = { ...prev }; delete next[subject]; return next; });
    });
  };

  const deleteFinalsGradeAction = async (subject: string) => {
    const existing = ksh.getGradesForSubject(FINALS_SEMESTER, subject);
    if (existing.length > 0) await deleteGrade(existing[0].id);
  };

  const _saveAdjustment = (semester: number, subject: string, value: number, school: School) =>
    submitting("Failed to save adjustment. Please try again.", async () => {
      if (value === 0) {
        const res = await adjustmentsApi.remove({ semester, subject, school });
        if (!res.ok) return setError("Failed to delete adjustment");
      } else {
        const res = await adjustmentsApi.save({ value, semester, subject, school });
        if (!res.ok) return setError(await apiError(res, "Failed to save adjustment"));
      }
      await fetchAdjustments();
    }, { busy: false });

  const saveAdjustmentAction = (semester: number, subject: string, value: number) =>
    _saveAdjustment(semester, subject, value, "KSH");

  const addBzzGrade = (mod: string) =>
    _addGrade({ semester: BZZ_SEMESTER, subject: mod, school: "BZZ" }, `bzz-${mod}`);

  const saveBzzAdjustment = (mod: string, value: number) =>
    _saveAdjustment(BZZ_SEMESTER, mod, value, "BZZ");

  const bulkImportGrades = (subject: string, entries: BulkGradeEntry[]) => {
    const target = activeSchool === "BZZ"
      ? { semester: BZZ_SEMESTER, subject, school: "BZZ" }
      : { semester: activeSemester, subject };
    return submitting("Failed to import grades. Please try again.", async () => {
      const createdIds: string[] = [];
      for (const entry of entries) {
        const res = await gradesApi.create({ ...entry, ...target });
        if (!res.ok) {
          setError(await apiError(res, "Failed to import a grade"));
          break;
        }
        const created: Grade = await res.json();
        createdIds.push(created.id);
      }
      await fetchGrades();
      if (createdIds.length === 0) return;
      pushUndo(
        `Pasted ${createdIds.length} grade${createdIds.length !== 1 ? "s" : ""}`,
        async () => {
          await Promise.all(createdIds.map((id) => gradesApi.remove(id)));
          await fetchGrades();
        }
      );
    }, { busy: false });
  };

  const clearSemesterGrades = async (semester: number) => {
    const toDelete = grades.filter((g) => g.semester === semester && g.school !== "BZZ");
    if (toDelete.length === 0) return;
    await submitting("Failed to clear semester grades. Please try again.", async () => {
      for (const g of toDelete) await gradesApi.removeWithRetry(g.id);
      await fetchGrades();
      pushUndo(`Cleared semester ${semester} (${toDelete.length} grades)`, async () => {
        for (const g of toDelete) await gradesApi.createWithRetry(recreateBody(g));
        await fetchGrades();
      });
    });
  };

  // ─── UI actions ───────────────────────────────────────────────

  const selectSemester = (sem: number) => {
    setActiveSemester(sem);
    setEditingGrade(null);
    if (isRegularSemester(sem)) setLastRegularSemester(sem);
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
    saveAdjustmentAction(semester, subject, parseOrZero(adjustmentInput));
    setEditingAdjustment(null);
  };

  const startEditingFinals = (entry: string, currentGrade: Grade | null) => {
    setEditingGrade(`finals-${entry}`);
    setFinalsInputs((prev) => ({
      ...prev,
      [entry]: currentGrade?.value.toString() ?? "",
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
    ...addForm,
    ...editForm,
    expandedSubjects,
    editingAdjustment,
    adjustmentInput, setAdjustmentInput,
    finalsInputs,
    selectSemester,
    dismissError: () => setError(null),
    addGrade, updateGrade, deleteGrade,
    saveFinalsGrade,
    deleteFinalsGrade: deleteFinalsGradeAction,
    saveAdjustment: saveAdjustmentAction,
    cancelEditing,
    toggleExpand,
    startEditingAdjustment, cancelEditingAdjustment, handleSaveAdjustment,
    startEditingFinals, cancelEditingFinals, handleDeleteFinalsEntry, onFinalsInputChange,
    // KSH computed
    ...ksh,
    // BZZ computed
    ...bzz,
    addBzzGrade, saveBzzAdjustment,
    bulkImportGrades,
    clearSemesterGrades,
    undoEntry,
    undoLastAction,
    dismissUndo,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
