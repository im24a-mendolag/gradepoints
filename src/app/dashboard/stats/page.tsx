"use client";

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
} from "@/lib/semesters";
import { getAvgColor, getGradeHex, roundToHalf, subjectColorHex } from "../utils";
import SchoolSelector from "../components/SchoolSelector";
import Sidebar from "../components/Sidebar";
import BottomTabBar from "../components/BottomTabBar";
import type { School } from "../types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, Cell, ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  ReferenceLine,
} from "recharts";

/* Theme-stable chart chrome: subject hues + muted grade hues read on both
   themes; grid/axis use translucent gray; tooltip stays dark (legible on both). */
const GRID = "rgba(128,128,128,0.16)";
const AXIS = "rgba(128,128,128,0.4)";
const TICK = "#8a8784";
const PASS_LINE = "#c98a00";
const ACCENT = "#3e63dd";

const CHART_TOOLTIP = {
  contentStyle: {
    borderRadius: 6,
    border: "1px solid #3b3a36",
    backgroundColor: "#1b1a17",
    color: "#eeede9",
    zIndex: 9999,
  },
  wrapperStyle: { zIndex: 9999 },
  labelStyle: { color: "#eeede9", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#cfccc5" },
  cursor: { stroke: AXIS },
};

const cardCls = "bg-surface rounded-card border border-line p-4 sm:p-6";
const statCardCls = "bg-surface rounded-card border border-line p-5";
const statLabel = "text-[11px] font-semibold tracking-wide uppercase text-fg-faint mb-1";
const heading = "text-sm sm:text-base font-medium text-fg mb-3 sm:mb-4";

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

  const semesterTrendData = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    return { semester: `Sem ${sem}`, avg: getSemesterAverage(sem), semNum: sem };
  });

  const trendAvgs = semesterTrendData.map((d) => d.avg).filter((a): a is number => a !== null);
  const trendYMin = trendAvgs.length > 0 ? Math.max(1, Math.floor(Math.min(...trendAvgs) - 0.5)) : 1;

  const allSubjects = Array.from(new Set(Object.values(SEMESTER_SUBJECTS).flat().filter((s) => s !== "IDPA")));
  const subjectProgressData = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const point: Record<string, string | number | null> = { semester: `Sem ${sem}` };
    for (const subject of allSubjects) {
      const subs = SEMESTER_SUBJECTS[sem] ?? [];
      point[subject] = subs.includes(subject as never) ? getSubjectAverage(sem, subject) : null;
    }
    return point;
  });

  const subjectAvgs = subjectProgressData.flatMap((d) =>
    allSubjects.map((s) => d[s]).filter((v): v is number => typeof v === "number")
  );
  const subjectYMin = subjectAvgs.length > 0 ? Math.max(1, Math.floor(Math.min(...subjectAvgs) - 0.5)) : 1;

  const finalGradesData = OVERVIEW_SUBJECTS
    .map((subject) => ({ subject, grade: getFinalSubjectGrade(subject).finalGrade }))
    .filter((d) => d.grade !== null);

  const kshGrades = grades.filter((g) => !g.school || g.school === "KSH");
  const regularGrades = kshGrades.filter((g) => g.semester !== FINALS_SEMESTER);
  const distribution = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => ({
    range: v.toFixed(1),
    count: 0,
    color: getGradeHex(v),
  }));
  for (const g of regularGrades) {
    const bucket = distribution.find((d) => parseFloat(d.range) === roundToHalf(g.value));
    if (bucket) bucket.count++;
  }
  const distributionData = distribution.filter((d) => d.count > 0);

  const radarData = OVERVIEW_SUBJECTS.map((subject) => ({ subject, grade: getFinalSubjectGrade(subject).finalGrade ?? 0 }));

  const semesterPassFail = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => ({ semester: i + 1, status: getSemesterStatus(i + 1) }));
  const overviewStatus = getOverviewStatus();

  const finalsAvg = getFinalsAverage();
  const totalGrades = regularGrades.length;
  const avgGrade = totalGrades > 0 ? regularGrades.reduce((s, g) => s + g.value, 0) / totalGrades : 0;
  const highestGrade = totalGrades > 0 ? Math.max(...regularGrades.map((g) => g.value)) : 0;
  const lowestGrade = totalGrades > 0 ? Math.min(...regularGrades.map((g) => g.value)) : 0;

  const gradeCountBySubject: Record<string, number> = {};
  for (const g of regularGrades) gradeCountBySubject[g.subject] = (gradeCountBySubject[g.subject] || 0) + 1;

  if (kshGrades.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-fg-faint text-lg">No KSH grades yet. Add some grades to see your statistics!</p>
        <Link href="/dashboard" className="mt-4 inline-block text-fg hover:opacity-70 font-medium">Go to Dashboard →</Link>
      </div>
    );
  }

  const passCell = (passed: boolean | null) =>
    passed === null
      ? "bg-sunken border-line text-fg-faint"
      : passed
      ? "bg-subject-green/10 border-subject-green/40 text-subject-green"
      : "bg-now-tint border-now/40 text-now";

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={statCardCls}><p className={statLabel}>Total grades</p><p className="font-mono text-2xl text-fg">{totalGrades}</p></div>
        <div className={statCardCls}><p className={statLabel}>Average grade</p><p className={`font-mono text-2xl ${getAvgColor(avgGrade)}`}>{avgGrade.toFixed(2)}</p></div>
        <div className={statCardCls}><p className={statLabel}>Finals avg</p><p className={`font-mono text-2xl ${finalsAvg !== null ? getAvgColor(finalsAvg) : "text-fg-faint"}`}>{finalsAvg !== null ? finalsAvg.toFixed(2) : "—"}</p></div>
        <div className={statCardCls}><p className={statLabel}>Highest grade</p><p className={`font-mono text-2xl ${getAvgColor(highestGrade)}`}>{highestGrade}</p></div>
        <div className={statCardCls}><p className={statLabel}>Lowest grade</p><p className={`font-mono text-2xl ${getAvgColor(lowestGrade)}`}>{lowestGrade}</p></div>
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Semester Pass / Fail</h2>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {semesterPassFail.map(({ semester, status }) => (
            <div key={semester} className="flex flex-col items-center gap-1">
              <span className="text-[11px] text-fg-faint font-mono">Sem {semester}</span>
              <div className={`w-14 h-14 rounded-card flex items-center justify-center border ${passCell(status ? status.passed : null)}`}>
                {status ? (status.passed ? "✓" : "✗") : "—"}
              </div>
              <span className={`text-[11px] font-mono ${status?.semAvg != null ? getAvgColor(status.semAvg) : "text-fg-faint"}`}>
                {status?.semAvg != null ? status.semAvg.toFixed(1) : "—"}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-line">
            <span className="text-[11px] text-fg-faint font-mono">Final</span>
            <div className={`w-14 h-14 rounded-card flex items-center justify-center border ${passCell(overviewStatus ? overviewStatus.passed : null)}`}>
              {overviewStatus ? (overviewStatus.passed ? "✓" : "✗") : "—"}
            </div>
            {overviewStatus && <span className={`text-[11px] font-mono ${getAvgColor(overviewStatus.avg)}`}>{overviewStatus.avg.toFixed(1)}</span>}
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Semester Average Trend</h2>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={semesterTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="semester" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
            <YAxis domain={[trendYMin, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
            <Tooltip formatter={(value?: number) => [value?.toFixed(2) ?? "—", "Average"]} {...CHART_TOOLTIP} />
            {trendYMin <= 4 && <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" label={{ value: "Pass: 4.0", position: "insideTopLeft", fontSize: 11, fill: PASS_LINE, offset: 6 }} />}
            <Area type="linear" dataKey="avg" stroke={ACCENT} strokeWidth={3} fill="url(#avgGradient)" dot={{ r: 5, fill: ACCENT, stroke: "#1b1a17", strokeWidth: 2 }} connectNulls />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Subject Progress Across Semesters</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={subjectProgressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="semester" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
            <YAxis domain={[subjectYMin, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
            <Tooltip {...CHART_TOOLTIP} />
            <Legend
              wrapperStyle={{ color: TICK }}
              onClick={(e) => {
                const key = e.dataKey as string;
                setHiddenSubjects((prev) => {
                  const next = new Set(prev);
                  if (next.has(key)) next.delete(key); else next.add(key);
                  return next;
                });
              }}
              formatter={(value: string) => (
                <span style={{ color: hiddenSubjects.has(value) ? "#6c6963" : TICK, cursor: "pointer" }}>{value}</span>
              )}
            />
            {subjectYMin <= 4 && <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />}
            {allSubjects.map((subject) => (
              <Line key={subject} type="monotone" dataKey={subject} stroke={subjectColorHex(subject)} strokeWidth={2} dot={{ r: 4 }} connectNulls hide={hiddenSubjects.has(subject)} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={cardCls}>
          <h2 className={heading}>Final Subject Grades</h2>
          {finalGradesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={finalGradesData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: TICK }} interval={0} angle={-30} textAnchor="end" height={60} stroke={AXIS} />
                <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
                <Tooltip formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]} {...CHART_TOOLTIP} />
                <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {finalGradesData.map((entry, index) => <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-fg-faint text-sm text-center py-12">Not enough data yet</p>}
        </div>

        <div className={cardCls}>
          <h2 className={heading}>Subject Strengths</h2>
          {radarData.some((d) => d.grade > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke={AXIS} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: TICK }} />
                <PolarRadiusAxis domain={[0, 6]} tick={{ fontSize: 10, fill: TICK }} />
                <Radar dataKey="grade" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: ACCENT }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-fg-faint text-sm text-center py-12">Not enough data yet</p>}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Grade Distribution</h2>
        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distributionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
              <Tooltip formatter={(value?: number) => [value ?? 0, "Grades"]} {...CHART_TOOLTIP} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-fg-faint text-sm text-center py-12">No grades yet</p>}
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Grades per Subject</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(gradeCountBySubject).sort((a, b) => b[1] - a[1]).map(([subject, count]) => (
            <div key={subject} className="rounded-control border border-line bg-sunken/50 p-3 text-center">
              <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: subjectColorHex(subject) }} />
              <p className="text-sm font-medium text-fg">{subject}</p>
              <p className="text-[11px] text-fg-faint">{count} grade{count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BzzStatsContent() {
  const { grades, getBzzModuleAverage, getBzzNormalAverage, getBzzUkAverage, getBzzFinalAverage, getBzzIpaAverage } = useDashboard();
  const bzzGrades = grades.filter((g) => g.school === "BZZ");

  if (bzzGrades.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-fg-faint text-lg">No BZZ grades yet. Add some grades to see your statistics!</p>
        <Link href="/dashboard" className="mt-4 inline-block text-fg hover:opacity-70 font-medium">Go to Dashboard →</Link>
      </div>
    );
  }

  const normalAvg = getBzzNormalAverage();
  const ukAvg = getBzzUkAverage();
  const finalAvg = getBzzFinalAverage();
  const ipaGrade = getBzzIpaAverage();

  const normalModuleData = (BZZ_NORMAL_MODULES as readonly string[]).map((mod) => ({ module: mod, grade: getBzzModuleAverage(mod) })).filter((d) => d.grade !== null);
  const ukModuleData = (BZZ_UK_MODULES as readonly string[]).map((mod) => ({ module: mod, grade: getBzzModuleAverage(mod) })).filter((d) => d.grade !== null);

  const distribution = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => ({ range: v.toFixed(1), count: 0, color: getGradeHex(v) }));
  for (const g of bzzGrades) {
    const bucket = distribution.find((d) => parseFloat(d.range) === roundToHalf(g.value));
    if (bucket) bucket.count++;
  }
  const distributionData = distribution.filter((d) => d.count > 0);

  const gradeCountByModule: Record<string, number> = {};
  for (const g of bzzGrades) gradeCountByModule[g.subject] = (gradeCountByModule[g.subject] || 0) + 1;

  const avgColor = (v: number | null) => (v === null ? "text-fg-faint" : getAvgColor(v));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className={statCardCls}><p className={statLabel}>Total grades</p><p className="font-mono text-2xl text-fg">{bzzGrades.length}</p></div>
        <div className={statCardCls}><p className={statLabel}>Normal avg</p><p className={`font-mono text-2xl ${avgColor(normalAvg)}`}>{normalAvg !== null ? normalAvg.toFixed(1) : "—"}</p></div>
        <div className={statCardCls}><p className={statLabel}>ÜK avg</p><p className={`font-mono text-2xl ${avgColor(ukAvg)}`}>{ukAvg !== null ? ukAvg.toFixed(1) : "—"}</p></div>
        <div className={statCardCls}><p className={statLabel}>Final avg</p><p className={`font-mono text-2xl ${avgColor(finalAvg)}`}>{finalAvg !== null ? finalAvg.toFixed(2) : "—"}</p></div>
        <div className={statCardCls}><p className={statLabel}>IPA</p><p className={`font-mono text-2xl ${avgColor(ipaGrade)}`}>{ipaGrade !== null ? ipaGrade.toFixed(2) : "—"}</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className={cardCls}>
          <h2 className={heading}>Normal Module Grades</h2>
          {normalModuleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={normalModuleData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="module" tick={{ fontSize: 10, fill: TICK }} interval={0} angle={-45} textAnchor="end" height={60} stroke={AXIS} />
                <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
                <Tooltip formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]} {...CHART_TOOLTIP} />
                <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {normalModuleData.map((entry, index) => <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-fg-faint text-sm text-center py-12">Not enough data yet</p>}
        </div>

        <div className={cardCls}>
          <h2 className={heading}>ÜK Module Grades</h2>
          {ukModuleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ukModuleData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="module" tick={{ fontSize: 11, fill: TICK }} interval={0} stroke={AXIS} />
                <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
                <Tooltip formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]} {...CHART_TOOLTIP} />
                <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />
                <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
                  {ukModuleData.map((entry, index) => <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-fg-faint text-sm text-center py-12">Not enough data yet</p>}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Grade Distribution</h2>
        {distributionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={distributionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
              <Tooltip formatter={(value?: number) => [value ?? 0, "Grades"]} {...CHART_TOOLTIP} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {distributionData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-fg-faint text-sm text-center py-12">No grades yet</p>}
      </div>

      <div className={cardCls}>
        <h2 className={heading}>Grades per Module</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {Object.entries(gradeCountByModule).sort((a, b) => b[1] - a[1]).map(([mod, count]) => (
            <div key={mod} className="rounded-control border border-line bg-sunken/50 p-3 text-center">
              <p className="text-sm font-medium text-fg">{mod}</p>
              <p className="text-[11px] text-fg-faint">{count} grade{count !== 1 ? "s" : ""}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function StatsContent() {
  const { activeSchool, loading } = useDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg" />
        </main>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
        <header className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Statistics</h1>
            <p className="text-[11px] text-fg-muted mt-0.5">{activeSchool} · charts &amp; trends</p>
          </div>
          <div className="lg:hidden shrink-0">
            <SchoolSelector />
          </div>
        </header>

        <div className="space-y-4 sm:space-y-6">
          {activeSchool === "KSH" ? <KshStatsContent /> : <BzzStatsContent />}
        </div>
      </main>

      <BottomTabBar />
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
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg" />
      </div>
    }>
      <StatsWrapper />
    </Suspense>
  );
}
