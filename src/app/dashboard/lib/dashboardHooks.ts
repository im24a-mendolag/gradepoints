"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOTAL_SEMESTERS } from "@/lib/semesters";
import type { Adjustment, Grade, School } from "../types";
import { toDateInputString } from "../utils";
import { makeKshComputations } from "./kshComputations";
import { makeBzzComputations } from "./bzzComputations";

const isKsh = (item: { school?: School }) => !item.school || item.school === "KSH";
const isBzz = (item: { school?: School }) => item.school === "BZZ";

/** Loads the user's grades and adjustments, exposing refetchers for after mutations. */
export function useGradeData() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);

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

  return { grades, adjustments, loading, fetchGrades, fetchAdjustments };
}

/** KSH and BZZ computation factories, memoized on their school's data. */
export function useSchoolComputations(grades: Grade[], adjustments: Adjustment[], finalsInputs: Record<string, string>) {
  const kshGrades = useMemo(() => grades.filter(isKsh), [grades]);
  const kshAdjustments = useMemo(() => adjustments.filter(isKsh), [adjustments]);
  const bzzGrades = useMemo(() => grades.filter(isBzz), [grades]);
  const bzzAdjustments = useMemo(() => adjustments.filter(isBzz), [adjustments]);

  const ksh = useMemo(
    () => makeKshComputations(kshGrades, kshAdjustments, finalsInputs),
    [kshGrades, kshAdjustments, finalsInputs]
  );
  const bzz = useMemo(() => makeBzzComputations(bzzGrades, bzzAdjustments), [bzzGrades, bzzAdjustments]);

  return { ksh, bzz };
}

/** Latest regular KSH semester (1…TOTAL_SEMESTERS) with at least one grade, or null. */
function latestKshSemester(grades: Grade[]): number | null {
  const semesters = grades
    .filter((g) => isKsh(g) && g.semester >= 1 && g.semester <= TOTAL_SEMESTERS)
    .map((g) => g.semester);
  return semesters.length > 0 ? Math.max(...semesters) : null;
}

/**
 * Once grades load, selects the latest KSH semester that has a grade — unless a
 * tab was deep-linked (`initialSemester`) or the user is on BZZ. Runs at most once.
 */
export function useAutoSelectSemester(
  { loading, grades, initialSemester, initialSchool }: { loading: boolean; grades: Grade[]; initialSemester?: number; initialSchool: School },
  select: (semester: number) => void,
) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current || (loading && initialSemester === undefined)) return;
    done.current = true;
    if (initialSemester !== undefined || initialSchool !== "KSH") return;
    const latest = latestKshSemester(grades);
    if (latest !== null) select(latest);
  }, [loading, grades, initialSemester, initialSchool]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Error + busy state, and `submitting` to run an action with both handled. */
export function useSubmitting() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Clears the error, runs `fn` (flagging busy unless `busy` is false), and reports `failMsg` if it throws. */
  const submitting = async (failMsg: string, fn: () => Promise<void>, { busy = true } = {}) => {
    setError(null);
    if (busy) setIsSubmitting(true);
    try {
      await fn();
    } catch {
      setError(failMsg);
    } finally {
      if (busy) setIsSubmitting(false);
    }
  };

  return { isSubmitting, error, setError, submitting };
}

type UndoAction = { label: string; perform: () => Promise<void> };

/** Single-slot undo that expires after 8s. `run` wraps performing it (busy flag + error). */
export function useUndo(run: (failMsg: string, fn: () => Promise<void>) => Promise<void>) {
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); };

  useEffect(() => clearTimer, []);

  const pushUndo = (label: string, perform: () => Promise<void>) => {
    clearTimer();
    setUndoAction({ label, perform });
    timer.current = setTimeout(() => setUndoAction(null), 8000);
  };

  const dismissUndo = () => {
    clearTimer();
    setUndoAction(null);
  };

  const undoLastAction = async () => {
    if (!undoAction) return;
    dismissUndo();
    await run("Failed to undo. Please try again.", undoAction.perform);
  };

  return {
    undoEntry: undoAction ? { label: undoAction.label } : null,
    pushUndo,
    undoLastAction,
    dismissUndo,
  };
}

type AddFormState = { gradeValue: string; gradeWeight: string; gradeDescription: string; gradeDate: string };

const emptyAddForm = (): AddFormState => ({ gradeValue: "", gradeWeight: "1", gradeDescription: "", gradeDate: toDateInputString() });

/** The add-grade form, kept per school so switching KSH↔BZZ doesn't discard typed input. */
export function useAddForm() {
  const [form, setForm] = useState<AddFormState>(emptyAddForm);
  const saved = useRef<Record<School, AddFormState>>({ KSH: emptyAddForm(), BZZ: emptyAddForm() });

  const setter = (key: keyof AddFormState) => (v: string) => setForm((f) => ({ ...f, [key]: v }));

  return {
    ...form,
    setGradeValue: setter("gradeValue"),
    setGradeWeight: setter("gradeWeight"),
    setGradeDescription: setter("gradeDescription"),
    setGradeDate: setter("gradeDate"),
    resetAddForm: () => setForm(emptyAddForm()),
    /** Saves the current form under `from` and restores the one saved for `to`. */
    swapSchool: (from: School, to: School) => {
      saved.current[from] = form;
      setForm(saved.current[to]);
    },
  };
}

/** The inline edit-grade form. */
export function useEditForm() {
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editWeight, setEditWeight] = useState("1");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  const startEditing = (grade: Grade) => {
    setEditingGrade(grade.id);
    setEditValue(grade.value.toString());
    setEditWeight(grade.weight.toString());
    setEditDescription(grade.description);
    setEditDate(toDateInputString(grade.date));
  };

  const resetEditForm = () => {
    setEditingGrade(null);
    setEditValue("");
    setEditWeight("1");
    setEditDescription("");
    setEditDate("");
  };

  return {
    editingGrade, setEditingGrade,
    editValue, setEditValue,
    editWeight, setEditWeight,
    editDescription, setEditDescription,
    editDate, setEditDate,
    startEditing,
    resetEditForm,
  };
}
