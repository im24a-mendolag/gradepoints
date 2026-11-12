"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getAvgColor, getGradeHex, roundToHalf } from "../utils";

/* Theme-stable chart chrome: subject hues + muted grade hues read on both
   themes; grid/axis use translucent gray; tooltip stays dark (legible on both). */
export const GRID = "rgba(128,128,128,0.16)";
export const AXIS = "rgba(128,128,128,0.4)";
export const TICK = "#8a8784";
export const PASS_LINE = "#c98a00";
export const ACCENT = "#3e63dd";
export const CHART_MARGIN = { top: 5, right: 20, bottom: 5, left: 0 };

export const CHART_TOOLTIP = {
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

type GradeLike = { value: number; subject: string };

/** Lowest y-axis bound that still shows every value with some headroom. */
export function yMin(values: number[]) {
  return values.length > 0 ? Math.max(1, Math.floor(Math.min(...values) - 0.5)) : 1;
}

/** Buckets grades into half-grade steps (6.0 … 1.0), keeping non-empty buckets. */
function gradeDistribution(grades: GradeLike[]) {
  const buckets = [6, 5.5, 5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1].map((v) => ({
    range: v.toFixed(1),
    count: 0,
    color: getGradeHex(v),
  }));
  for (const g of grades) {
    const bucket = buckets.find((d) => parseFloat(d.range) === roundToHalf(g.value));
    if (bucket) bucket.count++;
  }
  return buckets.filter((d) => d.count > 0);
}

/** Number of grades per subject/module, most first. */
function countBySubject(grades: GradeLike[]) {
  const counts: Record<string, number> = {};
  for (const g of grades) counts[g.subject] = (counts[g.subject] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

/** Text color class for an average, faint when there is none. */
export const avgColor = (v: number | null) => (v === null ? "text-fg-faint" : getAvgColor(v));

export function fmt(v: number | null, digits: number) {
  return v !== null ? v.toFixed(digits) : "—";
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={cardCls}>
      <h2 className={heading}>{title}</h2>
      {children}
    </div>
  );
}

function NoData({ text = "Not enough data yet" }: { text?: string }) {
  return <p className="text-fg-faint text-sm text-center py-12">{text}</p>;
}

export function StatCard({ label, value, color = "text-fg" }: { label: string; value: ReactNode; color?: string }) {
  return (
    <div className={statCardCls}>
      <p className={statLabel}>{label}</p>
      <p className={`font-mono text-2xl ${color}`}>{value}</p>
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">{children}</div>;
}

export function EmptyStats({ school }: { school: string }) {
  return (
    <div className="text-center py-20">
      <p className="text-fg-faint text-lg">No {school} grades yet. Add some grades to see your statistics!</p>
      <Link href="/dashboard" className="mt-4 inline-block text-fg hover:opacity-70 font-medium">Go to Dashboard →</Link>
    </div>
  );
}

const axisTick = (fontSize: number) => ({ fontSize, fill: TICK });

/** Bar chart of grades (0–6) colored by grade, with the 4.0 pass line. */
export function GradeBarChart({
  title,
  data,
  labelKey,
  xAxis,
}: {
  title: string;
  data: { grade: number | null }[];
  labelKey: string;
  xAxis: { fontSize: number; angle?: number };
}) {
  const angled = xAxis.angle !== undefined;
  return (
    <ChartCard title={title}>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis
              dataKey={labelKey}
              tick={axisTick(xAxis.fontSize)}
              interval={0}
              stroke={AXIS}
              {...(angled && { angle: xAxis.angle, textAnchor: "end", height: 60 })}
            />
            <YAxis domain={[0, 6]} ticks={[1, 2, 3, 4, 5, 6]} tick={axisTick(12)} stroke={AXIS} />
            <Tooltip formatter={(value?: number) => [value?.toFixed(1) ?? "—", "Grade"]} {...CHART_TOOLTIP} />
            <ReferenceLine y={4} stroke={PASS_LINE} strokeDasharray="4 4" />
            <Bar dataKey="grade" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => <Cell key={index} fill={getGradeHex(entry.grade ?? 0)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <NoData />}
    </ChartCard>
  );
}

export function DistributionCard({ grades }: { grades: GradeLike[] }) {
  const data = gradeDistribution(grades);
  return (
    <ChartCard title="Grade Distribution">
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
            <XAxis dataKey="range" tick={axisTick(12)} stroke={AXIS} />
            <YAxis allowDecimals={false} tick={axisTick(12)} stroke={AXIS} />
            <Tooltip formatter={(value?: number) => [value ?? 0, "Grades"]} {...CHART_TOOLTIP} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : <NoData text="No grades yet" />}
    </ChartCard>
  );
}

/** Grid of "<name> · N grades" tiles, optionally with a color dot per entry. */
export function CountGrid({
  title,
  grades,
  gridCls,
  dotColor,
}: {
  title: string;
  grades: GradeLike[];
  gridCls: string;
  dotColor?: (name: string) => string;
}) {
  return (
    <ChartCard title={title}>
      <div className={`grid ${gridCls} gap-3`}>
        {countBySubject(grades).map(([name, count]) => (
          <div key={name} className="rounded-control border border-line bg-sunken/50 p-3 text-center">
            {dotColor && <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: dotColor(name) }} />}
            <p className="text-sm font-medium text-fg">{name}</p>
            <p className="text-[11px] text-fg-faint">{count} grade{count !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
