"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { DashboardProvider, useDashboard } from "../DashboardContext";
import {
  SEMESTER_SUBJECTS,
  TOTAL_SEMESTERS,
  OVERVIEW_SUBJECTS,
  FINALS_SEMESTER,
  BZZ_NORMAL_MODULES,
  BZZ_UK_MODULES,
  BZZ_IPA,
} from "@/lib/semesters";
import { getAvgColor, getGradeHex } from "../utils";
import type { School } from "../types";
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
    zIndex: 9999,
  },
  wrapperStyle: {
    zIndex: 9999,
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

/**
 * Pill-style school selector for stats page.
 */
function StatsSchoolSelector() {
  const { activeSchool, setActiveSchool } = useDashboard();
  const schools: School[] = ["KSH", "BZZ"];
  return (
    <div className="inline-flex rounded-lg bg-neutral-800 p-0.5">
      {schools.map((s) => (
        <button
          key={s}
          onClick={() => setActiveSchool(s)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
            activeSchool === s
              ? "bg-blue-600 text-white shadow-sm"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/**
 * KSH-specific statistics content (existing charts).
 */
function KshStatsContent() {
  const [hiddenSubjects, setHiddenSubjects] = useState<Set<string>>(new Set());
  const {
    grades,
    getSubjectAverage,
    getSemesterAverage,
    getFinalsAverage,
    getFinalSubjectGrade,
    getSemesterStatus,
    getOverviewStatus,
  } = useDashboard();

  // ─── Build chart data ─────────────────────────────────────────

  const semesterTrendData = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const avg = getSemesterAverage(sem);
    return { semester: `Sem ${sem}`, avg, semNum: sem };
  });

  const trendAvgs = semesterTrendData.map((d) => d.avg).filter((a): a is number => a !== null);
  const trendYMin = trendAvgs.length > 0 ? Math.max(1, Math.floor(Math.min(...trendAvgs) - 0.5)) : 1;

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

  const subjectAvgs = subjectProgressData.flatMap((d) =>
    allSubjects.map((s) => d[s]).filter((v): v is number => typeof v === "number")
  );
  const subjectYMin = subjectAvgs.length > 0 ? Math.max(1, Math.floor(Math.min(...subjectAvgs) - 0.5)) : 1;

  const finalGradesData = OVERVIEW_SUBJECTS
    .map((subject) => {
      const { finalGrade } = getFinalSubjectGrade(subject);
      return { subject, grade: finalGrade };
    })
    .filter((d) => d.grade !== null);

  const kshGrades = grades.filter((g) => !g.school || g.school === "KSH");
  const regularGrades = kshGrades.filter((g) => g.semester !== FINALS_SEMESTER);
  const distribution = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => ({
    range: v.toFixed(1),
    count: 0,
    color: getGradeHex(v),
  }));
  for (const g of regularGrades) {
    const rounded = Math.round(g.value * 2) / 2;
    const bucket = distribution.find((d) => parseFloat(d.range) === rounded);
    if (bucket) bucket.count++;
  }
  const distributionData = distribution.filter((d) => d.count > 0);

  const radarData = OVERVIEW_SUBJECTS.map((subject) => {
    const { finalGrade } = getFinalSubjectGrade(subject);
    return { subject, grade: finalGrade ?? 0 };
  });

  const semesterPassFail = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const status = getSemesterStatus(sem);
    return { semester: sem, status };
  });

  const overviewStatus = getOverviewStatus();

  const finalsAvg = getFinalsAverage();
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

  const hasData = kshGrades.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-lg">No KSH grades yet. Add some grades to see your statistics!</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:text-blue-300 font-medium">
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Total Grades</p>
          <p className="text-2xl font-bold text-neutral-100">{totalGrades}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Average Grade</p>
          <p className={`text-2xl font-bold ${getAvgColor(avgGrade)}`}>
            {avgGrade.toFixed(2)}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Finals Avg</p>
          <p className={`text-2xl font-bold ${finalsAvg !== null ? getAvgColor(finalsAvg) : "text-neutral-600"}`}>
            {finalsAvg !== null ? finalsAvg.toFixed(2) : "—"}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Highest Grade</p>
          <p className={`text-2xl font-bold ${getAvgColor(highestGrade)}`}>{highestGrade}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Lowest Grade</p>
          <p className={`text-2xl font-bold ${getAvgColor(lowestGrade)}`}>
            {lowestGrade}
          </p>
        </div>
      </div>

      {/* Pass/Fail Timeline */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Semester Pass/Fail</h2>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
              <span className={`text-xs font-medium ${status?.semAvg != null ? getAvgColor(status.semAvg) : "text-neutral-600"}`}>
                {status?.semAvg != null ? status.semAvg.toFixed(1) : "—"}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-2 border-neutral-700">
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

      {/* Semester Average Trend */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Semester Average Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={semesterTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
            <YAxis domain={[trendYMin, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
            <Tooltip
              formatter={(value?: number) => [value?.toFixed(2) ?? "—", "Average"]}
              {...DARK_TOOLTIP}
            />
            {trendYMin <= 4 && <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Pass: 4.0", position: "insideTopLeft", fontSize: 11, fill: "#eab308", offset: 6 }} />}
            <Area
              type="linear"
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

      {/* Subject Progress */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Subject Progress Across Semesters</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={subjectProgressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
            <YAxis domain={[subjectYMin, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
            <Tooltip {...DARK_TOOLTIP} />
            <Legend
              wrapperStyle={{ color: "#d4d4d4" }}
              onClick={(e) => {
                const key = e.dataKey as string;
                setHiddenSubjects((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  return next;
                });
              }}
              formatter={(value: string) => (
                <span style={{ color: hiddenSubjects.has(value) ? "#525252" : "#d4d4d4", cursor: "pointer" }}>
                  {value}
                </span>
              )}
            />
            {subjectYMin <= 4 && <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />}
            {allSubjects.map((subject) => (
              <Line
                key={subject}
                type="monotone"
                dataKey={subject}
                stroke={SUBJECT_COLORS[subject] || "#737373"}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
                hide={hiddenSubjects.has(subject)}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Row: Final Grades Bar + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Final Subject Grades</h2>
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
                    <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-12">Not enough data yet</p>
          )}
        </div>

        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Subject Strengths</h2>
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

      {/* Grade Distribution */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Grade Distribution</h2>
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

      {/* Subject Grade Counts */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Grades per Subject</h2>
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
  );
}

/**
 * BZZ-specific statistics content.
 */
function BzzStatsContent() {
  const {
    grades,
    getBzzModuleAverage,
    getBzzNormalAverage,
    getBzzUkAverage,
    getBzzFinalAverage,
    getBzzIpaAverage,
  } = useDashboard();

  const bzzGrades = grades.filter((g) => g.school === "BZZ");

  if (bzzGrades.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500 text-lg">No BZZ grades yet. Add some grades to see your statistics!</p>
        <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:text-blue-300 font-medium">
          Go to Dashboard →
        </Link>
      </div>
    );
  }

  const normalAvg = getBzzNormalAverage();
  const ukAvg = getBzzUkAverage();
  const finalAvg = getBzzFinalAverage();
  const ipaGrade = getBzzIpaAverage();

  // Module grades bar chart (Normal)
  const normalModuleData = (BZZ_NORMAL_MODULES as readonly string[])
    .map((mod) => ({ module: mod, grade: getBzzModuleAverage(mod) }))
    .filter((d) => d.grade !== null);

  // Module grades bar chart (ÜK)
  const ukModuleData = (BZZ_UK_MODULES as readonly string[])
    .map((mod) => ({ module: mod, grade: getBzzModuleAverage(mod) }))
    .filter((d) => d.grade !== null);

  // Grade distribution
  const distribution = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => ({
    range: v.toFixed(1),
    count: 0,
    color: getGradeHex(v),
  }));
  for (const g of bzzGrades) {
    const rounded = Math.round(g.value * 2) / 2;
    const bucket = distribution.find((d) => parseFloat(d.range) === rounded);
    if (bucket) bucket.count++;
  }
  const distributionData = distribution.filter((d) => d.count > 0);

  // Grade count by module
  const gradeCountByModule: Record<string, number> = {};
  for (const g of bzzGrades) {
    gradeCountByModule[g.subject] = (gradeCountByModule[g.subject] || 0) + 1;
  }

  const avgColor = (v: number | null) =>
    v === null ? "text-neutral-600" : getAvgColor(v);

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Total Grades</p>
          <p className="text-2xl font-bold text-neutral-100">{bzzGrades.length}</p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Normal Avg</p>
          <p className={`text-2xl font-bold ${avgColor(normalAvg)}`}>
            {normalAvg !== null ? normalAvg.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">ÜK Avg</p>
          <p className={`text-2xl font-bold ${avgColor(ukAvg)}`}>
            {ukAvg !== null ? ukAvg.toFixed(1) : "—"}
          </p>
        </div>
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">Final Avg</p>
          <p className={`text-2xl font-bold ${avgColor(finalAvg)}`}>
            {finalAvg !== null ? finalAvg.toFixed(2) : "—"}
          </p>
        </div>
        <div
          className={`rounded-xl shadow-sm border p-5 ${
            ipaGrade !== null
              ? ipaGrade >= 4
                ? "bg-green-900/20 border-green-800"
                : "bg-red-900/20 border-red-800"
              : "bg-neutral-900 border-neutral-800"
          }`}
        >
          <p className="text-sm text-neutral-400 mb-1">IPA</p>
          <p className={`text-2xl font-bold ${avgColor(ipaGrade)}`}>
            {ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}
          </p>
        </div>
      </div>

      {/* Normal vs ÜK comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Normal Module Grades */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Normal Module Grades</h2>
          {normalModuleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={normalModuleData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="module" tick={{ fontSize: 10, fill: "#a3a3a3" }} interval={0} angle={-45} textAnchor="end" height={60} stroke="#404040" />
                <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                <Tooltip
                  formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]}
                  {...DARK_TOOLTIP}
                />
                <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {normalModuleData.map((entry, index) => (
                    <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-12">Not enough data yet</p>
          )}
        </div>

        {/* ÜK Module Grades */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">ÜK Module Grades</h2>
          {ukModuleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ukModuleData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="module" tick={{ fontSize: 11, fill: "#a3a3a3" }} interval={0} stroke="#404040" />
                <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: "#a3a3a3" }} stroke="#404040" />
                <Tooltip
                  formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]}
                  {...DARK_TOOLTIP}
                />
                <ReferenceLine y={4} stroke="#eab308" strokeDasharray="4 4" />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {ukModuleData.map((entry, index) => (
                    <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-neutral-500 text-sm text-center py-12">Not enough data yet</p>
          )}
        </div>
      </div>

      {/* Grade Distribution */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Grade Distribution</h2>
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

      {/* Grades per Module */}
      <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-neutral-100 mb-3 sm:mb-4">Grades per Module</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Object.entries(gradeCountByModule)
            .sort((a, b) => b[1] - a[1])
            .map(([mod, count]) => (
              <div
                key={mod}
                className="rounded-lg border border-neutral-700 bg-neutral-800/50 p-3 text-center"
              >
                <p className="text-sm font-medium text-neutral-200">{mod}</p>
                <p className="text-xs text-neutral-500">{count} grade{count !== 1 ? "s" : ""}</p>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

function StatsContent() {
  const { data: session } = useSession();
  const { activeSchool, loading } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href={`/dashboard?school=${activeSchool}`} className="text-xl font-bold text-neutral-100 hover:opacity-80 transition shrink-0">
              Grade<span className="text-blue-500">Points</span>
            </Link>
            <StatsSchoolSelector />
            <span className="text-sm text-neutral-500 hidden sm:inline">/ Statistics</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            <Link
              href={`/dashboard?school=${activeSchool}`}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Back
            </Link>
            <span className="text-sm text-neutral-400 hidden sm:inline">{session?.user?.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-8">
        {activeSchool === "KSH" ? <KshStatsContent /> : <BzzStatsContent />}
      </main>
    </div>
  );
}

function StatsWrapper() {
  const searchParams = useSearchParams();
  const initialSchool: School = searchParams.get("school") === "BZZ" ? "BZZ" : "KSH";
  return (
    <DashboardProvider initialSchool={initialSchool}>
      <StatsContent />
    </DashboardProvider>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <StatsWrapper />
    </Suspense>
  );
}
