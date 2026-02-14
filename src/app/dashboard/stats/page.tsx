"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { DashboardProvider, useDashboard } from "../DashboardContext";
import {
  SEMESTER_SUBJECTS,
  TOTAL_SEMESTERS,
  OVERVIEW_SUBJECTS,
  FINALS_SEMESTER,
} from "@/lib/semesters";
import { getAvgColor } from "../utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  ReferenceLine,
} from "recharts";

/** Color palette for subject lines in charts */
const SUBJECT_COLORS: Record<string, string> = {
  German: "#ef4444",
  French: "#3b82f6",
  English: "#8b5cf6",
  Math: "#f59e0b",
  WR: "#10b981",
  FrW: "#06b6d4",
  History: "#f97316",
  Science: "#84cc16",
  IDAF: "#ec4899",
  IDPA: "#a855f7",
};

/** Dark tooltip style shared across all charts */
const DARK_TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid #404040",
    backgroundColor: "#171717",
    color: "#e5e5e5",
  },
  labelStyle: {
    color: "#e5e5e5",
    fontWeight: 600,
    marginBottom: 4,
  },
  itemStyle: {
    color: "#d4d4d4",
  },
  cursor: { stroke: "#525252" },
};

function StatsContent() {
  const { data: session } = useSession();
  const {
    grades,
    loading,
    getSubjectAverage,
    getSemesterAverage,
    getFinalSubjectGrade,
    getSemesterStatus,
    getOverviewStatus,
  } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // ─── Build chart data ─────────────────────────────────────────

  // 1. Semester averages trend
  const semesterTrendData = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const avg = getSemesterAverage(sem);
    return { semester: `Sem ${sem}`, avg, semNum: sem };
  });

  // 2. Subject progress across semesters (multi-line)
  const allSubjects = Array.from(
    new Set(
      Object.values(SEMESTER_SUBJECTS).flat()
        .filter((s) => s !== "IDPA")
    )
  );
  const subjectProgressData = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const point: Record<string, string | number | null> = { semester: `Sem ${sem}` };
    for (const subject of allSubjects) {
      const subs = SEMESTER_SUBJECTS[sem] ?? [];
      if (subs.includes(subject as never)) {
        point[subject] = getSubjectAverage(sem, subject);
      } else {
        point[subject] = null;
      }
    }
    return point;
  });

  // 3. Final subject grades (bar chart)
  const finalGradesData = OVERVIEW_SUBJECTS
    .map((subject) => {
      const { finalGrade } = getFinalSubjectGrade(subject);
      return { subject, grade: finalGrade };
    })
    .filter((d) => d.grade !== null);

  // 4. Grade distribution
  const regularGrades = grades.filter((g) => g.semester !== FINALS_SEMESTER);
  const distribution = [
    { range: "6.0", count: 0, color: "#16a34a" },
    { range: "5.5", count: 0, color: "#22c55e" },
    { range: "5.0", count: 0, color: "#3b82f6" },
    { range: "4.5", count: 0, color: "#60a5fa" },
    { range: "4.0", count: 0, color: "#eab308" },
    { range: "3.5", count: 0, color: "#f97316" },
    { range: "3.0", count: 0, color: "#ef4444" },
    { range: "2.5", count: 0, color: "#dc2626" },
    { range: "2.0", count: 0, color: "#b91c1c" },
    { range: "1.5", count: 0, color: "#991b1b" },
    { range: "1.0", count: 0, color: "#7f1d1d" },
  ];
  for (const g of regularGrades) {
    const bucket = distribution.find((d) => parseFloat(d.range) === g.value);
    if (bucket) bucket.count++;
  }
  const distributionData = distribution.filter((d) => d.count > 0);

  // 5. Radar chart
  const radarData = OVERVIEW_SUBJECTS.map((subject) => {
    const { finalGrade } = getFinalSubjectGrade(subject);
    return { subject, grade: finalGrade ?? 0 };
  });

  // 6. Semester pass/fail
  const semesterPassFail = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const status = getSemesterStatus(sem);
    return { semester: sem, status };
  });

  // 7. Overview status
  const overviewStatus = getOverviewStatus();

  // 8. Grades over time
  const gradesByDate = [...regularGrades]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((g, i) => ({
      idx: i,
      date: new Date(g.date).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" }),
      value: g.value,
      subject: g.subject,
    }));

  // Count stats
  const totalGrades = regularGrades.length;
  const avgGrade = totalGrades > 0
    ? (regularGrades.reduce((s, g) => s + g.value, 0) / totalGrades)
    : 0;
  const highestGrade = totalGrades > 0 ? Math.max(...regularGrades.map((g) => g.value)) : 0;
  const lowestGrade = totalGrades > 0 ? Math.min(...regularGrades.map((g) => g.value)) : 0;

  const gradeCountBySubject: Record<string, number> = {};
  for (const g of regularGrades) {
    gradeCountBySubject[g.subject] = (gradeCountBySubject[g.subject] || 0) + 1;
  }

  const hasData = grades.length > 0;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xl font-bold text-neutral-100 hover:opacity-80 transition">
              Grade<span className="text-blue-500">Points</span>
            </Link>
            <span className="text-sm text-neutral-500">/ Statistics</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Back to Dashboard
            </Link>
            <span className="text-sm text-neutral-400">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {!hasData ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-lg">No grades yet. Add some grades to see your statistics!</p>
            <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:text-blue-300 font-medium">
              Go to Dashboard →
            </Link>
          </div>
        ) : (
          <>
            {/* ─── Quick Stats ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
                <p className="text-sm text-neutral-400 mb-1">Total Grades</p>
                <p className="text-2xl font-bold text-neutral-100">{totalGrades}</p>
              </div>
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
                <p className="text-sm text-neutral-400 mb-1">Average Grade</p>
                <p className={`text-2xl font-bold ${avgGrade >= 4 ? "text-blue-400" : "text-red-400"}`}>
                  {avgGrade.toFixed(2)}
                </p>
              </div>
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
                <p className="text-sm text-neutral-400 mb-1">Highest Grade</p>
                <p className="text-2xl font-bold text-green-400">{highestGrade}</p>
              </div>
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
                <p className="text-sm text-neutral-400 mb-1">Lowest Grade</p>
                <p className={`text-2xl font-bold ${lowestGrade >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                  {lowestGrade}
                </p>
              </div>
            </div>

            {/* ─── Pass/Fail Timeline ─── */}
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">Semester Pass/Fail</h2>
              <div className="flex items-center gap-3 flex-wrap">
                {semesterPassFail.map(({ semester, status }) => (
                  <div key={semester} className="flex flex-col items-center gap-1">
                    <span className="text-xs text-neutral-500">Sem {semester}</span>
                    <div
                      className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border-2 ${
                        status
                          ? status.passed
                            ? "bg-green-900/30 border-green-700 text-green-400"
                            : "bg-red-900/30 border-red-700 text-red-400"
                          : "bg-neutral-800 border-neutral-700 text-neutral-600"
                      }`}
                    >
                      {status ? (status.passed ? "✓" : "✗") : "—"}
                    </div>
                    {status?.semAvg !== undefined && status.semAvg !== null && (
                      <span className={`text-xs font-medium ${getAvgColor(status.semAvg)}`}>
                        {status.semAvg.toFixed(1)}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex flex-col items-center gap-1 ml-4 pl-4 border-l-2 border-neutral-700">
                  <span className="text-xs text-neutral-500 font-medium">Final</span>
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg border-2 ${
                      overviewStatus
                        ? overviewStatus.passed
                          ? "bg-green-900/30 border-green-700 text-green-400"
                          : "bg-red-900/30 border-red-700 text-red-400"
                        : "bg-neutral-800 border-neutral-700 text-neutral-600"
                    }`}
                  >
                    {overviewStatus ? (overviewStatus.passed ? "✓" : "✗") : "—"}
                  </div>
                  {overviewStatus && (
                    <span className={`text-xs font-medium ${getAvgColor(overviewStatus.avg)}`}>
                      {overviewStatus.avg.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Semester Average Trend ─── */}
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">Semester Average Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={semesterTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                  <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                  <Tooltip
                    formatter={(value?: number) => [value?.toFixed(2) ?? "—", "Average"]}
                    {...DARK_TOOLTIP}
                  />
                  <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Pass: 4.0", position: "insideTopLeft", fontSize: 11, fill: "#eab308", offset: 6 }} />
                  <Area
                    type="monotone"
                    dataKey="avg"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#avgGradient)"
                    dot={{ r: 5, fill: "#3b82f6", stroke: "#171717", strokeWidth: 2 }}
                    connectNulls
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ─── Subject Progress ─── */}
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">Subject Progress Across Semesters</h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={subjectProgressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                  <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                  <Tooltip {...DARK_TOOLTIP} />
                  <Legend wrapperStyle={{ color: "#d4d4d4" }} />
                  <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />
                  {allSubjects.map((subject) => (
                    <Line
                      key={subject}
                      type="monotone"
                      dataKey={subject}
                      stroke={SUBJECT_COLORS[subject] || "#737373"}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ─── Row: Final Grades Bar + Radar ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Final subject grades bar */}
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-100 mb-4">Final Subject Grades</h2>
                {finalGradesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={finalGradesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "#a3a3a3" }} interval={0} angle={-30} textAnchor="end" height={60} stroke="#404040" />
                      <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                      <Tooltip
                        formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]}
                        {...DARK_TOOLTIP}
                      />
                      <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />
                      <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                        {finalGradesData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              (entry.grade ?? 0) >= 5 ? "#22c55e"
                              : (entry.grade ?? 0) >= 4 ? "#3b82f6"
                              : "#ef4444"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-500 text-sm text-center py-12">Not enough data yet</p>
                )}
              </div>

              {/* Radar chart */}
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-100 mb-4">Subject Strengths</h2>
                {radarData.some((d) => d.grade > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#404040" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#d4d4d4" }} />
                      <PolarRadiusAxis domain={[0, 6]} tick={{ fontSize: 10, fill: "#a3a3a3" }} />
                      <Radar
                        dataKey="grade"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.2}
                        strokeWidth={2}
                        dot={{ r: 4, fill: "#3b82f6" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-neutral-500 text-sm text-center py-12">Not enough data yet</p>
                )}
              </div>
            </div>

            {/* ─── Grade Distribution ─── */}
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">Grade Distribution</h2>
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={distributionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                    <Tooltip
                      formatter={(value?: number) => [value ?? 0, "Grades"]}
                      {...DARK_TOOLTIP}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-neutral-500 text-sm text-center py-12">No grades yet</p>
              )}
            </div>

            {/* ─── Grades Over Time ─── */}
            {gradesByDate.length > 0 && (
              <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
                <h2 className="text-lg font-semibold text-neutral-100 mb-4">All Grades Over Time</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={gradesByDate} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a3a3a3" }} interval={Math.max(0, Math.floor(gradesByDate.length / 10))} stroke="#404040" />
                    <YAxis domain={[1, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                    <Tooltip
                      formatter={(value?: number) => [value ?? "—", "Grade"]}
                      {...DARK_TOOLTIP}
                    />
                    <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#737373"
                      strokeWidth={1.5}
                      dot={{ r: 3, fill: "#3b82f6", stroke: "#171717", strokeWidth: 1 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ─── Subject Grade Counts ─── */}
            <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-6">
              <h2 className="text-lg font-semibold text-neutral-100 mb-4">Grades per Subject</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Object.entries(gradeCountBySubject)
                  .sort((a, b) => b[1] - a[1])
                  .map(([subject, count]) => (
                    <div
                      key={subject}
                      className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3 text-center"
                    >
                      <div
                        className="w-3 h-3 rounded-full mx-auto mb-1.5"
                        style={{ backgroundColor: SUBJECT_COLORS[subject] || "#737373" }}
                      />
                      <p className="text-sm font-medium text-neutral-200">{subject}</p>
                      <p className="text-xs text-neutral-500">{count} grade{count !== 1 ? "s" : ""}</p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function StatsPage() {
  return (
    <DashboardProvider>
      <StatsContent />
    </DashboardProvider>
  );
}
