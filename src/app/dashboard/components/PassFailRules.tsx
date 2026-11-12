"use client";

import { useState, type ReactNode } from "react";
import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";
import { IconCheck, IconX, IconChevron } from "./Icons";

type Pass = boolean | null;

function passTone(pass: Pass, neutral = "text-fg-faint") {
  if (pass === null) return neutral;
  return pass ? "text-subject-green" : "text-now";
}

function StatusIcon({ pass }: { pass: Pass }) {
  if (pass === null) return <span className="text-fg-faint text-sm">—</span>;
  return pass ? (
    <IconCheck size={15} className="text-subject-green" />
  ) : (
    <IconX size={15} className="text-now" />
  );
}

/**
 * One rule line. With `pass` it shows a status icon and is toned by the
 * result; without it, it is a plain value row toned by `color`.
 */
function RuleRow({ pass, label, value, color }: { pass?: Pass; label: string; value: ReactNode; color?: string }) {
  const hasRule = pass !== undefined;
  const tone = color ?? passTone(pass ?? null);
  return (
    <div className="px-4 py-2.5 flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        {hasRule && <StatusIcon pass={pass} />}
        <span className="text-[13px] text-fg-muted">{label}</span>
      </div>
      <span className={`text-[13px] font-mono text-right shrink-0 ${tone}`}>{value}</span>
    </div>
  );
}

function Panel({ passed, heading, children }: { passed: Pass; heading: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-line overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer"
      >
        <span className={passTone(passed, "text-fg-muted")}>{heading}</span>
        <IconChevron size={14} className={`text-fg-faint transition-transform ${open ? "rotate-90" : ""} xl:hidden`} />
      </button>
      <div className={`divide-y divide-line border-t border-line ${open ? "" : "hidden xl:block"}`}>{children}</div>
    </div>
  );
}

const plural = (n: number, word: string) => `${n} ${word}${n !== 1 ? "s" : ""}`;
const fmt = (v: number | null | undefined, digits: number) => (v != null ? v.toFixed(digits) : "—");

interface RuleStatus {
  passed: boolean;
  rule1Pass: boolean;
  rule2Pass: boolean;
  rule3Pass: boolean;
  subjectsBelow4: string[];
  subjectsBelow4Count: number;
  negativePoints: number;
}

/** The three KSH promotion rules, shared by the semester and 3-year panels. */
function KshRules({ status, avg }: { status: RuleStatus | null; avg: number | null | undefined }) {
  return (
    <>
      <RuleRow pass={status?.rule1Pass ?? null} label="Average ≥ 4.0" value={fmt(avg, 2)} />
      <RuleRow
        pass={status?.rule2Pass ?? null}
        label="Max 2 below 4.0"
        value={
          status ? (
            <>
              {plural(status.subjectsBelow4Count, "subject")}
              {status.subjectsBelow4Count > 0 && (
                <span className="text-fg-faint block sm:inline"> ({status.subjectsBelow4.join(", ")})</span>
              )}
            </>
          ) : "—"
        }
      />
      <RuleRow pass={status?.rule3Pass ?? null} label="Max 2 neg. points" value={status ? plural(status.negativePoints, "pt") : "—"} />
    </>
  );
}

export function SemesterPassFailRules({ semester }: { semester: number }) {
  const { getSemesterStatus } = useDashboard();
  const status = getSemesterStatus(semester);
  return (
    <Panel passed={status?.passed ?? null} heading={`Pass / Fail — Semester ${semester}`}>
      <KshRules status={status} avg={status?.semAvg} />
    </Panel>
  );
}

export function OverviewPassFailRules() {
  const { getOverviewStatus } = useDashboard();
  const status = getOverviewStatus();
  return (
    <Panel passed={status?.passed ?? null} heading="Pass / Fail — 3-Year Final">
      <KshRules status={status} avg={status?.avg} />
    </Panel>
  );
}

const avgTone = (v: number | null) => (v !== null ? getAvgColor(v) : "text-fg-faint");
const atLeast4 = (v: number | null): Pass => (v !== null ? v >= 4 : null);

export function BzzPassFail() {
  const { getBzzPassFail } = useDashboard();
  const { normalAvg, ukAvg, finalAvg, ipaGrade, ipaPass, passed } = getBzzPassFail();

  const isDecided = finalAvg !== null || ipaPass === false;

  return (
    <Panel passed={isDecided ? passed : null} heading="Pass / Fail — BZZ">
      <RuleRow label="Normal Modules avg" value={fmt(normalAvg, 1)} color={avgTone(normalAvg)} />
      <RuleRow label="ÜK Modules avg" value={fmt(ukAvg, 1)} color={avgTone(ukAvg)} />
      <RuleRow pass={atLeast4(finalAvg)} label="Final Average ≥ 4.0" value={fmt(finalAvg, 2)} />
      <RuleRow pass={ipaPass} label="IPA ≥ 4.0" value={fmt(ipaGrade, 2)} />
    </Panel>
  );
}
