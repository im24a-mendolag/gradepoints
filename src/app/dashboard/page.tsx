"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { SEMESTER_SUBJECTS, TOTAL_SEMESTERS, FINALS_SEMESTER, OVERVIEW_TAB, FINALS_ENTRIES, SUBJECTS, IDPA_FINAL_FOR_IDAF, OVERVIEW_SUBJECTS } from "@/lib/semesters";

interface Grade {
  id: string;
  value: number;
  weight: number;
  description: string;
  date: string;
  semester: number;
  subject: string;
}

interface Adjustment {
  id: string;
  value: number;
  semester: number;
  subject: string;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSemester, setActiveSemester] = useState(1);

  // Add grade form
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [gradeValue, setGradeValue] = useState("");
  const [gradeWeight, setGradeWeight] = useState("1");
  const [gradeDescription, setGradeDescription] = useState("");
  const [gradeDate, setGradeDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Edit grade
  const [editingGrade, setEditingGrade] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editWeight, setEditWeight] = useState("1");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");

  // Expanded subjects (grades hidden by default)
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Adjustment editing
  const [editingAdjustment, setEditingAdjustment] = useState<string | null>(null);
  const [adjustmentInput, setAdjustmentInput] = useState("");

  // Finals grade inputs (controlled)
  const [finalsInputs, setFinalsInputs] = useState<Record<string, string>>({});

  // Error banner
  const [error, setError] = useState<string | null>(null);

  const fetchGrades = useCallback(async () => {
    try {
      const res = await fetch("/api/grades");
      if (res.ok) {
        const data = await res.json();
        setGrades(data);
      }
    } catch (err) {
      console.error("Failed to fetch grades", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdjustments = useCallback(async () => {
    try {
      const res = await fetch("/api/adjustments");
      if (res.ok) {
        const data = await res.json();
        setAdjustments(data);
      }
    } catch (err) {
      console.error("Failed to fetch adjustments", err);
    }
  }, []);

  useEffect(() => {
    fetchGrades();
    fetchAdjustments();
  }, [fetchGrades, fetchAdjustments]);

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
        const data = await res.json();
        setError(data.error || "Failed to add grade");
      }
    } catch (err) {
      console.error("Failed to add grade", err);
      setError("Failed to add grade. Please try again.");
    }
  };

  const getFinalsInputValue = (entry: string) => {
    if (finalsInputs[entry] !== undefined) return finalsInputs[entry];
    const existing = getGradesForSubject(FINALS_SEMESTER, entry);
    return existing.length > 0 ? existing[0].value.toString() : "";
  };

  const setFinalsGrade = async (subject: string, value: string) => {
    if (!value) return;
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 1 || numVal > 6) return;
    setError(null);

    const existing = getGradesForSubject(FINALS_SEMESTER, subject);
    try {
      if (existing.length > 0) {
        // Update existing finals grade
        const res = await fetch(`/api/grades/${existing[0].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: numVal }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to update finals grade");
          return;
        }
      } else {
        // Create new finals grade
        const res = await fetch("/api/grades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: numVal,
            weight: 1,
            description: "",
            semester: FINALS_SEMESTER,
            subject,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to add finals grade");
          return;
        }
      }
      await fetchGrades();
      // Clear the manual input so it reads from the saved grade
      setFinalsInputs((prev) => {
        const next = { ...prev };
        delete next[subject];
        return next;
      });
    } catch (err) {
      console.error("Failed to save finals grade", err);
      setError("Failed to save finals grade. Please try again.");
    }
  };

  const deleteFinalsGrade = async (subject: string) => {
    const existing = getGradesForSubject(FINALS_SEMESTER, subject);
    if (existing.length === 0) return;
    await deleteGrade(existing[0].id);
  };

  const deleteGrade = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/grades/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchGrades();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete grade");
      }
    } catch (err) {
      console.error("Failed to delete grade", err);
      setError("Failed to delete grade. Please try again.");
    }
  };

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
      if (res.ok) {
        setEditingGrade(null);
        fetchGrades();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update grade");
      }
    } catch (err) {
      console.error("Failed to update grade", err);
      setError("Failed to update grade. Please try again.");
    }
  };

  const getGradesForSubject = (semester: number, subject: string) =>
    grades.filter((g) => g.semester === semester && g.subject === subject);

  const getAdjustment = (semester: number, subject: string): number => {
    const adj = adjustments.find((a) => a.semester === semester && a.subject === subject);
    return adj ? adj.value : 0;
  };

  const saveAdjustment = async (semester: number, subject: string, value: number) => {
    setError(null);
    try {
      if (value === 0) {
        // Delete the adjustment
        await fetch("/api/adjustments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ semester, subject }),
        });
      } else {
        // Create or update
        const res = await fetch("/api/adjustments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value, semester, subject }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to save adjustment");
          return;
        }
      }
      await fetchAdjustments();
    } catch (err) {
      console.error("Failed to save adjustment", err);
      setError("Failed to save adjustment. Please try again.");
    }
  };

  const getRawSubjectAverage = (semester: number, subject: string) => {
    const subjectGrades = getGradesForSubject(semester, subject).filter((g) => g.weight > 0);
    if (subjectGrades.length === 0) return null;
    const totalWeight = subjectGrades.reduce((acc, g) => acc + g.weight, 0);
    const weightedSum = subjectGrades.reduce((acc, g) => acc + g.value * g.weight, 0);
    const rawAvg = weightedSum / totalWeight;
    const adjustment = getAdjustment(semester, subject);
    return Math.min(6, Math.max(1, rawAvg + adjustment));
  };

  const getSubjectAverage = (semester: number, subject: string) => {
    const raw = getRawSubjectAverage(semester, subject);
    if (raw === null) return null;
    return Math.min(6, Math.max(1, Math.round(raw * 2) / 2));
  };

  const getSemesterAverage = (semester: number) => {
    const semesterSubjects = SEMESTER_SUBJECTS[semester] ?? [];
    const subjectAverages = semesterSubjects
      .map((s) => getSubjectAverage(semester, s))
      .filter((avg): avg is number => avg !== null);
    if (subjectAverages.length === 0) return null;
    const sum = subjectAverages.reduce((acc, a) => acc + a, 0);
    return Math.round((sum / subjectAverages.length) * 2) / 2;
  };

  // Calculate the finals average (average of each subject group's average)
  const getFinalsAverage = () => {
    const groupAverages = [
      { name: "German", entries: ["German (Oral)", "German (Written)"] },
      { name: "French", entries: ["French (Oral)", "French (Written)"] },
      { name: "English", entries: ["English (Oral)", "English (Written)"] },
      { name: "Math", entries: ["Math (Written)"] },
      { name: "WR", entries: ["WR (Written)"] },
      { name: "FrW", entries: ["FrW (Written)"] },
    ].map((group) => {
      const entryGrades = group.entries
        .map((entry) => {
          const g = getGradesForSubject(FINALS_SEMESTER, entry);
          return g.length > 0 ? g[0].value : null;
        })
        .filter((v): v is number => v !== null);
      if (entryGrades.length === 0) return null;
      return Math.round((entryGrades.reduce((a, b) => a + b, 0) / entryGrades.length) * 2) / 2;
    }).filter((avg): avg is number => avg !== null);

    if (groupAverages.length === 0) return null;
    return Math.round((groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length) * 2) / 2;
  };

  const getOverallAverage = () => {
    // Include all semesters (1-6) and finals
    const semesterAverages = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1)
      .map((sem) => getSemesterAverage(sem))
      .filter((avg): avg is number => avg !== null);
    const finalsAvg = getFinalsAverage();
    const allAverages = [...semesterAverages, ...(finalsAvg !== null ? [finalsAvg] : [])];
    if (allAverages.length === 0) return null;
    const sum = allAverages.reduce((acc, a) => acc + a, 0);
    return Math.round((sum / allAverages.length) * 2) / 2;
  };

  const getSemesterStatus = (semester: number) => {
    const semesterSubjects = SEMESTER_SUBJECTS[semester] ?? [];
    const subjectAverages = semesterSubjects
      .map((s) => ({ subject: s as string, avg: getSubjectAverage(semester, s) }))
      .filter((s): s is { subject: string; avg: number } => s.avg !== null);

    if (subjectAverages.length === 0) return null;

    const semAvg = getSemesterAverage(semester);
    const subjectsBelow4 = subjectAverages.filter((s) => s.avg < 4);
    const negativePoints = subjectAverages.reduce((acc, s) => {
      if (s.avg < 4) return acc + (4 - s.avg);
      return acc;
    }, 0);

    const rule1Pass = semAvg !== null && semAvg >= 4;
    const rule2Pass = subjectsBelow4.length <= 2;
    const rule3Pass = negativePoints <= 2;

    const passed = rule1Pass && rule2Pass && rule3Pass;

    return {
      passed,
      semAvg,
      subjectsBelow4: subjectsBelow4.map((s) => s.subject),
      subjectsBelow4Count: subjectsBelow4.length,
      negativePoints: Math.round(negativePoints * 10) / 10,
      rule1Pass,
      rule2Pass,
      rule3Pass,
    };
  };

  // Get final exam grade for a subject (from finals tab)
  const getFinalsExamGrade = (subject: string): number | null => {
    const entries = FINALS_ENTRIES[subject];
    if (!entries) return null;
    const entryGrades = entries
      .map((entry) => {
        const g = getGradesForSubject(FINALS_SEMESTER, entry);
        return g.length > 0 ? g[0].value : null;
      })
      .filter((v): v is number => v !== null);
    if (entryGrades.length === 0) return null;
    return Math.round((entryGrades.reduce((a, b) => a + b, 0) / entryGrades.length) * 2) / 2;
  };

  // Get the semesters a subject appears in
  const getSemestersForSubject = (subject: string): number[] => {
    const semesters: number[] = [];
    for (let sem = 1; sem <= TOTAL_SEMESTERS; sem++) {
      if ((SEMESTER_SUBJECTS[sem] ?? []).includes(subject as never)) {
        semesters.push(sem);
      }
    }
    return semesters;
  };

  // Get the IDPA grade (used as "final" for IDAF)
  const getIdpaGrade = (): number | null => {
    const avg = getSubjectAverage(IDPA_FINAL_FOR_IDAF.finalSemester, IDPA_FINAL_FOR_IDAF.finalSubject);
    return avg;
  };

  // Get the final subject grade across all 3 years
  const getFinalSubjectGrade = (subject: string): { semesterAvg: number | null; finalsGrade: number | null; finalGrade: number | null } => {
    const semesters = getSemestersForSubject(subject);
    const semAvgs = semesters
      .map((sem) => getSubjectAverage(sem, subject))
      .filter((avg): avg is number => avg !== null);

    const semesterAvg = semAvgs.length > 0
      ? Math.round((semAvgs.reduce((a, b) => a + b, 0) / semAvgs.length) * 2) / 2
      : null;

    // Determine the "finals" grade: either from the Finals tab, or from IDPA for IDAF
    let finalsGrade: number | null;
    if (subject === IDPA_FINAL_FOR_IDAF.subject) {
      // IDAF uses IDPA's grade as its "final"
      finalsGrade = getIdpaGrade();
    } else {
      finalsGrade = getFinalsExamGrade(subject);
    }

    // If we have neither semester grades nor finals grade, nothing to show
    if (semesterAvg === null && finalsGrade === null) {
      return { semesterAvg: null, finalsGrade: null, finalGrade: null };
    }

    let finalGrade: number;
    if (semesterAvg !== null && finalsGrade !== null) {
      // Both exist: average of semester average and finals grade
      finalGrade = Math.round(((semesterAvg + finalsGrade) / 2) * 2) / 2;
    } else if (semesterAvg !== null) {
      // Only semester grades exist
      finalGrade = semesterAvg;
    } else {
      // Only finals grade exists (no semester grades yet)
      finalGrade = finalsGrade!;
    }

    return { semesterAvg, finalsGrade, finalGrade };
  };

  // Get overall pass/fail status for all 3 years
  const getOverviewStatus = () => {
    const subjectResults = OVERVIEW_SUBJECTS.map((subject) => {
      const { finalGrade } = getFinalSubjectGrade(subject);
      return { subject, finalGrade };
    }).filter((s): s is { subject: string; finalGrade: number } => s.finalGrade !== null);

    if (subjectResults.length === 0) return null;

    const avg = Math.round((subjectResults.reduce((acc, s) => acc + s.finalGrade, 0) / subjectResults.length) * 2) / 2;
    const subjectsBelow4 = subjectResults.filter((s) => s.finalGrade < 4);
    const negativePoints = subjectResults.reduce((acc, s) => {
      if (s.finalGrade < 4) return acc + (4 - s.finalGrade);
      return acc;
    }, 0);

    const rule1Pass = avg >= 4;
    const rule2Pass = subjectsBelow4.length <= 2;
    const rule3Pass = negativePoints <= 2;
    const passed = rule1Pass && rule2Pass && rule3Pass;

    return {
      passed,
      avg,
      subjectResults,
      subjectsBelow4: subjectsBelow4.map((s) => s.subject),
      subjectsBelow4Count: subjectsBelow4.length,
      negativePoints: Math.round(negativePoints * 10) / 10,
      rule1Pass,
      rule2Pass,
      rule3Pass,
    };
  };

  const getGradeColor = (value: number) => {
    if (value >= 5.5) return "text-green-600 bg-green-50 border-green-200";
    if (value >= 4.5) return "text-blue-600 bg-blue-50 border-blue-200";
    if (value >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const getAvgColor = (value: number) => {
    if (value >= 5.5) return "text-green-600";
    if (value >= 4.5) return "text-blue-600";
    if (value >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const subjects = activeSemester === FINALS_SEMESTER
    ? ["German (Oral)", "German (Written)", "French (Oral)", "French (Written)", "English (Oral)", "English (Written)", "Math (Written)", "WR (Written)", "FrW (Written)"]
    : (SEMESTER_SUBJECTS[activeSemester] ?? []);

  // Finals grouped by subject for card layout
  const finalsSubjects = [
    { name: "German", entries: ["German (Oral)", "German (Written)"] },
    { name: "French", entries: ["French (Oral)", "French (Written)"] },
    { name: "English", entries: ["English (Oral)", "English (Written)"] },
    { name: "Math", entries: ["Math (Written)"] },
    { name: "WR", entries: ["WR (Written)"] },
    { name: "FrW", entries: ["FrW (Written)"] },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const semesterAvg = activeSemester === FINALS_SEMESTER ? getFinalsAverage() : getSemesterAverage(activeSemester);
  const overallAvg = getOverallAverage();
  const semesterStatus = activeSemester > 0 && activeSemester !== FINALS_SEMESTER ? getSemesterStatus(activeSemester) : null;
  const overviewStatus = activeSemester === OVERVIEW_TAB ? getOverviewStatus() : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Grade<span className="text-blue-600">Points</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-600 hover:text-red-700 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 font-bold text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">
              {activeSemester === FINALS_SEMESTER ? "Finals" : activeSemester === OVERVIEW_TAB ? "Final Average" : `Semester ${activeSemester} Average`}
            </p>
            <p className={`text-2xl font-bold ${
              activeSemester === OVERVIEW_TAB
                ? overviewStatus ? getAvgColor(overviewStatus.avg) : "text-gray-400"
                : semesterAvg ? getAvgColor(semesterAvg) : "text-gray-400"
            }`}>
              {activeSemester === OVERVIEW_TAB
                ? overviewStatus ? overviewStatus.avg.toFixed(2) : "—"
                : semesterAvg ? semesterAvg.toFixed(2) : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Overall Average</p>
            <p className={`text-2xl font-bold ${overallAvg ? getAvgColor(overallAvg) : "text-gray-400"}`}>
              {overallAvg ? overallAvg.toFixed(2) : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-1">Total Grades</p>
            <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
          </div>
          {activeSemester > 0 && activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB && (
            <div className={`rounded-xl shadow-sm border p-5 ${
              semesterStatus
                ? semesterStatus.passed
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                : "bg-white border-gray-200"
            }`}>
              <p className="text-sm text-gray-500 mb-1">Semester Status</p>
              <p className={`text-2xl font-bold ${
                semesterStatus
                  ? semesterStatus.passed ? "text-green-600" : "text-red-600"
                  : "text-gray-400"
              }`}>
                {semesterStatus
                  ? semesterStatus.passed ? "✓ Passed" : "✗ Failed"
                  : "—"}
              </p>
            </div>
          )}
          {overviewStatus && (
            <div className={`rounded-xl shadow-sm border p-5 ${
              overviewStatus.passed
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}>
              <p className="text-sm text-gray-500 mb-1">Final Result</p>
              <p className={`text-2xl font-bold ${overviewStatus.passed ? "text-green-600" : "text-red-600"}`}>
                {overviewStatus.passed ? "✓ Passed" : "✗ Failed"}
              </p>
            </div>
          )}
        </div>

        {/* Pass/Fail Rules Breakdown — Semester */}
        {activeSemester > 0 && activeSemester !== FINALS_SEMESTER && activeSemester !== OVERVIEW_TAB && (
          <div className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
            semesterStatus
              ? semesterStatus.passed ? "border-green-200" : "border-red-200"
              : "border-gray-200"
          }`}>
            <div className={`px-5 py-3 text-sm font-semibold ${
              semesterStatus
                ? semesterStatus.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                : "bg-gray-50 text-gray-600"
            }`}>
              Pass/Fail Rules — Semester {activeSemester}
            </div>
            <div className="bg-white divide-y divide-gray-100">
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${semesterStatus ? (semesterStatus.rule1Pass ? "text-green-500" : "text-red-500") : "text-gray-300"}`}>
                    {semesterStatus ? (semesterStatus.rule1Pass ? "✓" : "✗") : "—"}
                  </span>
                  <span className="text-sm text-gray-700">Average ≥ 4.0</span>
                </div>
                <span className={`text-sm font-medium ${semesterStatus ? (semesterStatus.rule1Pass ? "text-green-600" : "text-red-600") : "text-gray-400"}`}>
                  {semesterStatus ? (semesterStatus.semAvg?.toFixed(2) ?? "—") : "—"}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${semesterStatus ? (semesterStatus.rule2Pass ? "text-green-500" : "text-red-500") : "text-gray-300"}`}>
                    {semesterStatus ? (semesterStatus.rule2Pass ? "✓" : "✗") : "—"}
                  </span>
                  <span className="text-sm text-gray-700">Max 2 subjects below 4.0</span>
                </div>
                <span className={`text-sm font-medium ${semesterStatus ? (semesterStatus.rule2Pass ? "text-green-600" : "text-red-600") : "text-gray-400"}`}>
                  {semesterStatus
                    ? <>
                        {semesterStatus.subjectsBelow4Count} subject{semesterStatus.subjectsBelow4Count !== 1 ? "s" : ""}
                        {semesterStatus.subjectsBelow4Count > 0 && (
                          <span className="text-gray-400 font-normal"> ({semesterStatus.subjectsBelow4.join(", ")})</span>
                        )}
                      </>
                    : "—"}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${semesterStatus ? (semesterStatus.rule3Pass ? "text-green-500" : "text-red-500") : "text-gray-300"}`}>
                    {semesterStatus ? (semesterStatus.rule3Pass ? "✓" : "✗") : "—"}
                  </span>
                  <span className="text-sm text-gray-700">Max 2 negative points</span>
                </div>
                <span className={`text-sm font-medium ${semesterStatus ? (semesterStatus.rule3Pass ? "text-green-600" : "text-red-600") : "text-gray-400"}`}>
                  {semesterStatus
                    ? <>{semesterStatus.negativePoints} point{semesterStatus.negativePoints !== 1 ? "s" : ""}</>
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pass/Fail Rules Breakdown — Overview */}
        {overviewStatus && (
          <div className={`mb-6 rounded-xl shadow-sm border overflow-hidden ${
            overviewStatus.passed ? "border-green-200" : "border-red-200"
          }`}>
            <div className={`px-5 py-3 text-sm font-semibold ${
              overviewStatus.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}>
              Pass/Fail Rules — 3-Year Final
            </div>
            <div className="bg-white divide-y divide-gray-100">
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${overviewStatus.rule1Pass ? "text-green-500" : "text-red-500"}`}>
                    {overviewStatus.rule1Pass ? "✓" : "✗"}
                  </span>
                  <span className="text-sm text-gray-700">Average ≥ 4.0</span>
                </div>
                <span className={`text-sm font-medium ${overviewStatus.rule1Pass ? "text-green-600" : "text-red-600"}`}>
                  {overviewStatus.avg.toFixed(2)}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${overviewStatus.rule2Pass ? "text-green-500" : "text-red-500"}`}>
                    {overviewStatus.rule2Pass ? "✓" : "✗"}
                  </span>
                  <span className="text-sm text-gray-700">Max 2 subjects below 4.0</span>
                </div>
                <span className={`text-sm font-medium ${overviewStatus.rule2Pass ? "text-green-600" : "text-red-600"}`}>
                  {overviewStatus.subjectsBelow4Count} subject{overviewStatus.subjectsBelow4Count !== 1 ? "s" : ""}
                  {overviewStatus.subjectsBelow4Count > 0 && (
                    <span className="text-gray-400 font-normal"> ({overviewStatus.subjectsBelow4.join(", ")})</span>
                  )}
                </span>
              </div>
              <div className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${overviewStatus.rule3Pass ? "text-green-500" : "text-red-500"}`}>
                    {overviewStatus.rule3Pass ? "✓" : "✗"}
                  </span>
                  <span className="text-sm text-gray-700">Max 2 negative points</span>
                </div>
                <span className={`text-sm font-medium ${overviewStatus.rule3Pass ? "text-green-600" : "text-red-600"}`}>
                  {overviewStatus.negativePoints} point{overviewStatus.negativePoints !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Semester Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => i + 1).map(
            (sem) => {
              const avg = getSemesterAverage(sem);
              return (
                <button
                  key={sem}
                  onClick={() => {
                    setActiveSemester(sem);
                    setAddingFor(null);
                    setEditingGrade(null);
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    activeSemester === sem
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Semester {sem}
                  {avg !== null && (
                    <span className={`ml-2 ${activeSemester === sem ? "text-blue-200" : "text-gray-400"}`}>
                      {avg.toFixed(1)}
                    </span>
                  )}
                </button>
              );
            }
          )}
          <button
            onClick={() => {
              setActiveSemester(FINALS_SEMESTER);
              setAddingFor(null);
              setEditingGrade(null);
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              activeSemester === FINALS_SEMESTER
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-purple-600 border border-purple-200 hover:bg-purple-50"
            }`}
          >
            Finals
          </button>
          <button
            onClick={() => {
              setActiveSemester(OVERVIEW_TAB);
              setAddingFor(null);
              setEditingGrade(null);
            }}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition cursor-pointer ${
              activeSemester === OVERVIEW_TAB
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-white text-amber-600 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            Overview
          </button>
        </div>

        {/* Subjects for active semester */}
        <div className="space-y-4">
          {activeSemester === OVERVIEW_TAB ? (
            /* Overview UI - final subject grades (IDPA excluded, consumed by IDAF) */
            <>
              {OVERVIEW_SUBJECTS.map((subject) => {
                const { semesterAvg: subSemAvg, finalsGrade, finalGrade } = getFinalSubjectGrade(subject);
                const hasFinals = !!FINALS_ENTRIES[subject];
                const hasIdpaFinal = subject === IDPA_FINAL_FOR_IDAF.subject;
                const hasAnyFinal = hasFinals || hasIdpaFinal;
                const semesters = getSemestersForSubject(subject);
                const finalLabel = hasIdpaFinal ? "IDPA" : "Final";

                return (
                  <div
                    key={subject}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{subject}</h3>
                        {finalGrade !== null && (
                          <span
                            className={`text-sm font-bold px-3 py-1 rounded-full border ${getGradeColor(finalGrade)}`}
                          >
                            {finalGrade.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          Semesters: {semesters.join(", ")}
                        </span>
                        <span>
                          Sem. Avg: {subSemAvg !== null ? (
                            <span className={`font-medium ${getAvgColor(subSemAvg)}`}>{subSemAvg.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </span>
                        {hasAnyFinal && (
                          <span>
                            {finalLabel}: {finalsGrade !== null ? (
                              <span className={`font-medium ${getAvgColor(finalsGrade)}`}>{finalsGrade.toFixed(1)}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Semester breakdown */}
                    <div className="px-6 pb-4 flex gap-2 flex-wrap">
                      {semesters.map((sem) => {
                        const avg = getSubjectAverage(sem, subject);
                        return (
                          <div key={sem} className="flex flex-col items-center">
                            <span className="text-[10px] text-gray-400 mb-0.5">S{sem}</span>
                            <span
                              className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold border ${
                                avg !== null ? getGradeColor(avg) : "border-gray-200 text-gray-300"
                              }`}
                            >
                              {avg !== null ? avg.toFixed(1) : "—"}
                            </span>
                          </div>
                        );
                      })}
                      {hasAnyFinal && (
                        <div className="flex flex-col items-center">
                          <span className={`text-[10px] mb-0.5 ${hasIdpaFinal ? "text-amber-500" : "text-purple-400"}`}>{finalLabel}</span>
                          <span
                            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold border ${
                              finalsGrade !== null ? getGradeColor(finalsGrade) : "border-gray-200 text-gray-300"
                            }`}
                          >
                            {finalsGrade !== null ? finalsGrade.toFixed(1) : "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : activeSemester === FINALS_SEMESTER ? (
            /* Finals UI - card per subject like regular semesters */
            <>
              {finalsSubjects.map((group) => {
                const groupGrades = group.entries
                  .map((entry) => {
                    const g = getGradesForSubject(FINALS_SEMESTER, entry);
                    return g.length > 0 ? g[0].value : null;
                  })
                  .filter((v): v is number => v !== null);
                const groupAvg =
                  groupGrades.length > 0
                    ? Math.round((groupGrades.reduce((a, b) => a + b, 0) / groupGrades.length) * 2) / 2
                    : null;

                return (
                <div
                  key={group.name}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Subject Header */}
                  <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                      {groupAvg !== null && (
                        <span
                          className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${getGradeColor(groupAvg)}`}
                        >
                          Ø {groupAvg.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Grade rows */}
                  <div className="divide-y divide-gray-100">
                    {group.entries.map((entry) => {
                      const existing = getGradesForSubject(FINALS_SEMESTER, entry);
                      const currentGrade = existing.length > 0 ? existing[0] : null;
                      const label = entry.includes("(Oral)")
                        ? "Oral"
                        : entry.includes("(Written)")
                        ? "Written"
                        : "Written";
                      const isEditingThis = editingGrade === `finals-${entry}`;

                      return (
                        <div
                          key={entry}
                          className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                          {isEditingThis ? (
                            /* Edit / Add inline form */
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="number"
                                min="1"
                                max="6"
                                step="any"
                                value={getFinalsInputValue(entry)}
                                onChange={(e) =>
                                  setFinalsInputs((prev) => ({ ...prev, [entry]: e.target.value }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const val = getFinalsInputValue(entry);
                                    if (val) {
                                      setFinalsGrade(entry, val);
                                      setEditingGrade(null);
                                    }
                                  }
                                }}
                                className="w-24 px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm text-gray-900"
                                placeholder="1–6"
                                autoFocus
                              />
                              <span className="text-sm text-gray-600">{label}</span>
                              <button
                                onClick={() => {
                                  const val = getFinalsInputValue(entry);
                                  if (val) {
                                    setFinalsGrade(entry, val);
                                    setEditingGrade(null);
                                  }
                                }}
                                disabled={!getFinalsInputValue(entry)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGrade(null);
                                  // Reset input to saved value
                                  setFinalsInputs((prev) => {
                                    const next = { ...prev };
                                    delete next[entry];
                                    return next;
                                  });
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            /* View mode */
                            <>
                              <div className="flex items-center gap-3">
                                {currentGrade ? (
                                  <span
                                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border ${getGradeColor(currentGrade.value)}`}
                                  >
                                    {currentGrade.value}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border border-gray-200 text-gray-300">
                                    —
                                  </span>
                                )}
                                <span className="text-sm text-gray-600">{label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingGrade(`finals-${entry}`);
                                    // Pre-fill input with current grade value
                                    if (currentGrade) {
                                      setFinalsInputs((prev) => ({ ...prev, [entry]: currentGrade.value.toString() }));
                                    } else {
                                      setFinalsInputs((prev) => ({ ...prev, [entry]: "" }));
                                    }
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                  {currentGrade ? "Edit" : "+ Add Grade"}
                                </button>
                                {currentGrade && (
                                  <button
                                    onClick={() => {
                                      setFinalsInputs((prev) => {
                                        const next = { ...prev };
                                        delete next[entry];
                                        return next;
                                      });
                                      deleteFinalsGrade(entry);
                                    }}
                                    className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </>
          ) : (
            /* Regular semester UI */
            subjects.map((subject) => {
              const subjectGrades = getGradesForSubject(activeSemester, subject);
              const avg = getSubjectAverage(activeSemester, subject);
              const rawAvg = getRawSubjectAverage(activeSemester, subject);
              const adj = getAdjustment(activeSemester, subject);
              const adjKey = `${activeSemester}-${subject}`;

              return (
                <div
                  key={subject}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Subject Header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setExpandedSubjects((prev) => {
                            const next = new Set(prev);
                            if (next.has(subject)) next.delete(subject);
                            else next.add(subject);
                            return next;
                          });
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer transition"
                        title={expandedSubjects.has(subject) ? "Hide grades" : "Show grades"}
                      >
                        <span className={`inline-block transition-transform ${expandedSubjects.has(subject) ? "rotate-90" : ""}`}>
                          ▶
                        </span>
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {subject}
                      </h3>
                      {avg !== null && (
                        <span
                          className={`text-sm font-medium px-2.5 py-0.5 rounded-full border ${getGradeColor(avg)}`}
                        >
                          Ø {avg.toFixed(1)}
                          {rawAvg !== null && (
                            <span className="text-gray-400 font-normal ml-1">({rawAvg.toFixed(2)})</span>
                          )}
                        </span>
                      )}
                      {adj !== 0 && (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${adj > 0 ? "text-green-600 bg-green-50 border-green-200" : "text-red-600 bg-red-50 border-red-200"}`}>
                          {adj > 0 ? "+" : ""}{adj}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {subjectGrades.length} grade{subjectGrades.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Adjustment button */}
                      {editingAdjustment === adjKey ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="any"
                            value={adjustmentInput}
                            onChange={(e) => setAdjustmentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = parseFloat(adjustmentInput);
                                saveAdjustment(activeSemester, subject, isNaN(val) ? 0 : val);
                                setEditingAdjustment(null);
                              }
                            }}
                            className="w-20 px-2 py-1 rounded border border-gray-300 text-sm text-center outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-900"
                            placeholder="±0.0"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const val = parseFloat(adjustmentInput);
                              saveAdjustment(activeSemester, subject, isNaN(val) ? 0 : val);
                              setEditingAdjustment(null);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAdjustment(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingAdjustment(adjKey);
                            setAdjustmentInput(adj !== 0 ? adj.toString() : "");
                          }}
                          className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                          title="Set bonus/malus"
                        >
                          ±
                        </button>
                      )}
                      <button
                        onClick={() => {
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
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        + Add Grade
                      </button>
                    </div>
                  </div>

                  {/* Add Grade Form + Grades List (collapsible) */}
                  {expandedSubjects.has(subject) && addingFor === subject && (
                    <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                      <div className="flex flex-wrap gap-3 items-end">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Grade (1–6)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="6"
                            step="0.5"
                            value={gradeValue}
                            onChange={(e) => setGradeValue(e.target.value)}
                            className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="5.0"
                            autoFocus
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Weight
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.5"
                            value={gradeWeight}
                            onChange={(e) => setGradeWeight(e.target.value)}
                            className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                          />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Description (optional)
                          </label>
                          <input
                            type="text"
                            value={gradeDescription}
                            onChange={(e) => setGradeDescription(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                            placeholder="e.g. Midterm exam"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Date
                          </label>
                          <input
                            type="date"
                            value={gradeDate}
                            onChange={(e) => setGradeDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                          />
                        </div>
                        <button
                          onClick={() => addGrade(subject)}
                          disabled={!gradeValue}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setAddingFor(null)}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Grades List */}
                  {expandedSubjects.has(subject) && (subjectGrades.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {subjectGrades.map((grade) => (
                        <div
                          key={grade.id}
                          className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                          {editingGrade === grade.id ? (
                            <div className="flex flex-wrap gap-3 items-end flex-1">
                              <input
                                type="number"
                                min="1"
                                max="6"
                                step="0.5"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-24 px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                              />
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.5"
                                value={editWeight}
                                onChange={(e) => setEditWeight(e.target.value)}
                                className="w-20 px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                              />
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) =>
                                  setEditDescription(e.target.value)
                                }
                                className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                                placeholder="Description"
                              />
                              <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="px-3 py-1.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm text-gray-900"
                              />
                              <button
                                onClick={() => updateGrade(grade.id)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingGrade(null)}
                                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold text-sm border ${getGradeColor(grade.value)}`}
                                >
                                  {grade.value}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                  ×{grade.weight}
                                </span>
                                <div>
                                  <p className="text-sm text-gray-900">
                                    {grade.description || "No description"}
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    {new Date(grade.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                setEditingGrade(grade.id);
                                setEditValue(grade.value.toString());
                                setEditWeight(grade.weight.toString());
                                setEditDescription(grade.description);
                                setEditDate(
                                      new Date(grade.date)
                                        .toISOString()
                                        .split("T")[0]
                                    );
                                  }}
                                  className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteGrade(grade.id)}
                                  className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-center text-sm text-gray-400">
                      No grades yet
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
