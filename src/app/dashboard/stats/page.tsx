"use client";

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
import { getAvgColor, subjectColorHex } from "../utils";
import SchoolSelector from "../components/SchoolSelector";
import Sidebar from "../components/Sidebar";
import BottomTabBar from "../components/BottomTabBar";
import { FullPageSpinner, LoadingLayout } from "../components/PageShell";
import type { School } from "../types";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  ReferenceLine,
} from "recharts";
import {
  ACCENT, AXIS, CHART_MARGIN, CHART_TOOLTIP, GRID, PASS_LINE, TICK,
  ChartCard, CountGrid, DistributionCard, EmptyStats, GradeBarChart, StatCard, StatGrid,
  avgColor, fmt, yMin,
} from "./charts";

function passCell(passed: boolean | null) {
  if (passed === null) return "bg-sunken border-line text-fg-faint";
  return passed
    ? "bg-subject-green/10 border-subject-green/40 text-subject-green"
    : "bg-now-tint border-now/40 text-now";
}

function passMark(passed: boolean | null) {
  if (passed === null) return "—";
  return passed ? "✓" : "✗";
}

function PassBadge({ passed }: { passed: boolean | null }) {
  return (
    <div className={`w-14 h-14 rounded-card flex items-center justify-center border ${passCell(passed)}`}>
      {passMark(passed)}
    </div>
  );
}

function SemesterPass({ semester }: { semester: number }) {
  const { getSemesterStatus } = useDashboard();
  const status = getSemesterStatus(semester);
  const semAvg = status?.semAvg ?? null;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-fg-faint font-mono">Sem {semester}</span>
      <PassBadge passed={status ? status.passed : null} />
      <span className={`text-[11px] font-mono ${avgColor(semAvg)}`}>{fmt(semAvg, 1)}</span>
    </div>
  );
}

function PassFailCard() {
  const { getOverviewStatus } = useDashboard();
  const overviewStatus = getOverviewStatus();
  return (
    <ChartCard title="Semester Pass / Fail">
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {Array.from({ length: TOTAL_SEMESTERS }, (_, i) => (
          <SemesterPass key={i + 1} semester={i + 1} />
        ))}
        <div className="flex flex-col items-center gap-1 ml-2 sm:ml-4 pl-2 sm:pl-4 border-l border-line">
          <span className="text-[11px] text-fg-faint font-mono">Final</span>
          <PassBadge passed={overviewStatus ? overviewStatus.passed : null} />
          {overviewStatus && <span className={`text-[11px] font-mono ${getAvgColor(overviewStatus.avg)}`}>{overviewStatus.avg.toFixed(1)}</span>}
        </div>
      </div>
    </ChartCard>
  );
}

function TrendCard() {
  const { getSemesterAverage } = useDashboard();
  const data = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    return { semester: `Sem ${sem}`, avg: getSemesterAverage(sem), semNum: sem };
  });
  const min = yMin(data.map((d) => d.avg).filter((a): a is number => a !== null));

  return (
    <ChartCard title="Semester Average Trend">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
              <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="semester" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
          <YAxis domain={[min, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
          <Tooltip formatter={(value?: number) => [value?.toFixed(2) ?? "—", "Average"]} {...CHART_TOOLTIP} />
          {min <= 4 && <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" label={{ value: "Pass: 4.0", position: "insideTopLeft", fontSize: 11, fill: PASS_LINE, offset: 6 }} />}
          <Area type="linear" dataKey="avg" stroke={ACCENT} strokeWidth={3} fill="url(#avgGradient)" dot={{ r: 5, fill: ACCENT, stroke: "#1b1a17", strokeWidth: 2 }} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const PROGRESS_SUBJECTS: string[] = Array.from(
  new Set(Object.values(SEMESTER_SUBJECTS).flat().filter((s) => s !== "IDPA")),
);

function SubjectProgressCard() {
  const { getSubjectAverage } = useDashboard();
  const [hiddenSubjects, setHiddenSubjects] = useState<Set<string>>(new Set());

  const data = Array.from({ length: TOTAL_SEMESTERS }, (_, i) => {
    const sem = i + 1;
    const subs: string[] = SEMESTER_SUBJECTS[sem] ?? [];
    const point: Record<string, string | number | null> = { semester: `Sem ${sem}` };
    for (const subject of PROGRESS_SUBJECTS) {
      point[subject] = subs.includes(subject) ? getSubjectAverage(sem, subject) : null;
    }
    return point;
  });
  const min = yMin(
    data.flatMap((d) => PROGRESS_SUBJECTS.map((s) => d[s]).filter((v): v is number => typeof v === "number")),
  );

  const toggle = (key: string) =>
    setHiddenSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <ChartCard title="Subject Progress Across Semesters">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="semester" tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
          <YAxis domain={[min, 6]} tick={{ fontSize: 12, fill: TICK }} stroke={AXIS} />
          <Tooltip {...CHART_TOOLTIP} />
          <Legend
            wrapperStyle={{ color: TICK }}
            onClick={(e) => toggle(e.dataKey as string)}
            formatter={(value: string) => (
              <span style={{ color: hiddenSubjects.has(value) ? "#6c6963" : TICK, cursor: "pointer" }}>{value}</span>
            )}
          />
          {min <= 4 && <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />}
          {PROGRESS_SUBJECTS.map((subject) => (
            <Line key={subject} type="monotone" dataKey={subject} stroke={subjectColorHex(subject)} strokeWidth={2} dot={{ r: 4 }} connectNulls hide={hiddenSubjects.has(subject)} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function StrengthsCard({ data }: { data: { subject: string; grade: number }[] }) {
  return (
    <ChartCard title="Subject Strengths">
      {data.some((d) => d.grade > 0) ? (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke={AXIS} />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: TICK }} />
            <PolarRadiusAxis domain={[0, 6]} tick={{ fontSize: 10, fill: TICK }} />
            <Radar dataKey="grade" stroke={ACCENT} fill={ACCENT} fillOpacity={0.2} strokeWidth={2} dot={{ r: 4, fill: ACCENT }} />
          </RadarChart>
        </ResponsiveContainer>
      ) : <p className="text-fg-faint text-sm text-center py-12">Not enough data yet</p>}
    </ChartCard>
  );
}

/** Count / average / highest / lowest of a set of grade values (0s when empty). */
function summarize(values: number[]) {
  if (values.length === 0) return { total: 0, avg: 0, highest: 0, lowest: 0 };
  return {
    total: values.length,
    avg: values.reduce((s, v) => s + v, 0) / values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
  };
}

function KshStatsContent() {
  const { grades, getFinalsAverage, getFinalSubjectGrade } = useDashboard();

  const kshGrades = grades.filter((g) => !g.school || g.school === "KSH");
  if (kshGrades.length === 0) return <EmptyStats school="KSH" />;

  const regularGrades = kshGrades.filter((g) => g.semester !== FINALS_SEMESTER);
  const { total, avg, highest, lowest } = summarize(regularGrades.map((g) => g.value));
  const finalsAvg = getFinalsAverage();

  const finalGrades = OVERVIEW_SUBJECTS.map((subject) => ({ subject, grade: getFinalSubjectGrade(subject).finalGrade }));

  return (
    <>
      <StatGrid>
        <StatCard label="Total grades" value={total} />
        <StatCard label="Average grade" value={avg.toFixed(2)} color={getAvgColor(avg)} />
        <StatCard label="Finals avg" value={fmt(finalsAvg, 2)} color={avgColor(finalsAvg)} />
        <StatCard label="Highest grade" value={highest} color={getAvgColor(highest)} />
        <StatCard label="Lowest grade" value={lowest} color={getAvgColor(lowest)} />
      </StatGrid>

      <PassFailCard />
      <TrendCard />
      <SubjectProgressCard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <GradeBarChart
          title="Final Subject Grades"
          data={finalGrades.filter((d) => d.grade !== null)}
          labelKey="subject"
          xAxis={{ fontSize: 11, angle: -30 }}
        />
        <StrengthsCard data={finalGrades.map((d) => ({ subject: d.subject, grade: d.grade ?? 0 }))} />
      </div>

      <DistributionCard grades={regularGrades} />
      <CountGrid title="Grades per Subject" grades={regularGrades} gridCls="grid-cols-2 sm:grid-cols-3 md:grid-cols-5" dotColor={subjectColorHex} />
    </>
  );
}

function moduleGrades(modules: readonly string[], getAverage: (mod: string) => number | null) {
  return modules.map((mod) => ({ module: mod, grade: getAverage(mod) })).filter((d) => d.grade !== null);
}

function BzzStatsContent() {
  const { grades, getBzzModuleAverage, getBzzNormalAverage, getBzzUkAverage, getBzzFinalAverage, getBzzIpaAverage } = useDashboard();
  const bzzGrades = grades.filter((g) => g.school === "BZZ");

  if (bzzGrades.length === 0) return <EmptyStats school="BZZ" />;

  const normalAvg = getBzzNormalAverage();
  const ukAvg = getBzzUkAverage();
  const finalAvg = getBzzFinalAverage();
  const ipaGrade = getBzzIpaAverage();

  return (
    <>
      <StatGrid>
        <StatCard label="Total grades" value={bzzGrades.length} />
        <StatCard label="Normal avg" value={fmt(normalAvg, 1)} color={avgColor(normalAvg)} />
        <StatCard label="ÜK avg" value={fmt(ukAvg, 1)} color={avgColor(ukAvg)} />
        <StatCard label="Final avg" value={fmt(finalAvg, 2)} color={avgColor(finalAvg)} />
        <StatCard label="IPA" value={fmt(ipaGrade, 2)} color={avgColor(ipaGrade)} />
      </StatGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <GradeBarChart
          title="Normal Module Grades"
          data={moduleGrades(BZZ_NORMAL_MODULES, getBzzModuleAverage)}
          labelKey="module"
          xAxis={{ fontSize: 10, angle: -45 }}
        />
        <GradeBarChart
          title="ÜK Module Grades"
          data={moduleGrades(BZZ_UK_MODULES, getBzzModuleAverage)}
          labelKey="module"
          xAxis={{ fontSize: 11 }}
        />
      </div>

      <DistributionCard grades={bzzGrades} />
      <CountGrid title="Grades per Module" grades={bzzGrades} gridCls="grid-cols-3 sm:grid-cols-4 md:grid-cols-6" />
    </>
  );
}

function StatsContent() {
  const { activeSchool, loading } = useDashboard();

  if (loading) return <LoadingLayout />;

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
    <Suspense fallback={<FullPageSpinner />}>
      <StatsWrapper />
    </Suspense>
  );
}
