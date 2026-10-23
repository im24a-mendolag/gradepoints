"use client";

import { useState, type ReactNode } from "react";
import { useDashboard } from "../DashboardContext";
import { IconCheck, IconX, IconChevron } from "./Icons";

function StatusIcon({ pass }: { pass: boolean | null }) {
  if (pass === null) return <span className="text-fg-faint text-sm">—</span>;
  return pass ? (
    <IconCheck size={15} className="text-subject-green" />
  ) : (
    <IconX size={15} className="text-now" />
  );
}

function RuleRow({ pass, label, value }: { pass: boolean | null; label: string; value: ReactNode }) {
  const tone = pass === null ? "text-fg-faint" : pass ? "text-subject-green" : "text-now";
  return (
    <div className="px-4 py-2.5 flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <StatusIcon pass={pass} />
        <span className="text-[13px] text-fg-muted">{label}</span>
      </div>
      <span className={`text-[13px] font-mono text-right shrink-0 ${tone}`}>{value}</span>
    </div>
  );
}

function Panel({
  passed,
  heading,
  children,
}: {
  passed: boolean | null;
  heading: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tone = passed === null ? "text-fg-muted" : passed ? "text-subject-green" : "text-now";
  return (
    <div className="rounded-card border border-line overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer"
      >
        <span className={tone}>{heading}</span>
        <IconChevron size={14} className={`text-fg-faint transition-transform ${open ? "rotate-90" : ""} xl:hidden`} />
      </button>
      <div className={`divide-y divide-line border-t border-line ${open ? "" : "hidden xl:block"}`}>{children}</div>
    </div>
  );
}

export function SemesterPassFailRules({ semester }: { semester: number }) {
  const { getSemesterStatus } = useDashboard();
  const status = getSemesterStatus(semester);
  return (
    <Panel passed={status?.passed ?? null} heading={`Pass / Fail — Semester ${semester}`}>
      <RuleRow pass={status?.rule1Pass ?? null} label="Average ≥ 4.0" value={status ? (status.semAvg?.toFixed(2) ?? "—") : "—"} />
      <RuleRow
        pass={status?.rule2Pass ?? null}
        label="Max 2 below 4.0"
        value={
          status ? (
            <>
              {status.subjectsBelow4Count} subject{status.subjectsBelow4Count !== 1 ? "s" : ""}
              {status.subjectsBelow4Count > 0 && (
                <span className="text-fg-faint block sm:inline"> ({status.subjectsBelow4.join(", ")})</span>
              )}
            </>
          ) : "—"
        }
      />
      <RuleRow pass={status?.rule3Pass ?? null} label="Max 2 neg. points" value={status ? `${status.negativePoints} pt${status.negativePoints !== 1 ? "s" : ""}` : "—"} />
    </Panel>
  );
}

export function OverviewPassFailRules() {
  const { getOverviewStatus } = useDashboard();
  const status = getOverviewStatus();
  return (
    <Panel passed={status?.passed ?? null} heading="Pass / Fail — 3-Year Final">
      <RuleRow pass={status?.rule1Pass ?? null} label="Average ≥ 4.0" value={status ? status.avg.toFixed(2) : "—"} />
      <RuleRow
        pass={status?.rule2Pass ?? null}
        label="Max 2 below 4.0"
        value={
          status ? (
            <>
              {status.subjectsBelow4Count} subject{status.subjectsBelow4Count !== 1 ? "s" : ""}
              {status.subjectsBelow4Count > 0 && (
                <span className="text-fg-faint block sm:inline"> ({status.subjectsBelow4.join(", ")})</span>
              )}
            </>
          ) : "—"
        }
      />
      <RuleRow pass={status?.rule3Pass ?? null} label="Max 2 neg. points" value={status ? `${status.negativePoints} pt${status.negativePoints !== 1 ? "s" : ""}` : "—"} />
    </Panel>
  );
}
