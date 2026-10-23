"use client";

import { useState, type ReactNode } from "react";
import { useDashboard } from "../DashboardContext";
import { getAvgColor } from "../utils";
import { IconCheck, IconX, IconChevron } from "./Icons";

function StatusIcon({ pass }: { pass: boolean | null }) {
  if (pass === null) return <span className="text-fg-faint text-sm">—</span>;
  return pass ? <IconCheck size={15} className="text-subject-green" /> : <IconX size={15} className="text-now" />;
}

export default function BzzPassFail() {
  const { getBzzPassFail } = useDashboard();
  const { normalAvg, ukAvg, finalAvg, ipaGrade, ipaPass, passed } = getBzzPassFail();
  const [open, setOpen] = useState(false);

  const avgPass = finalAvg !== null ? finalAvg >= 4 : null;
  const isDecided = finalAvg !== null || ipaPass === false;
  const headTone = !isDecided ? "text-fg-muted" : passed ? "text-subject-green" : "text-now";

  const AvgRow = ({ label, value, color }: { label: string; value: ReactNode; color: string }) => (
    <div className="px-4 py-2.5 flex items-center justify-between gap-2">
      <span className="text-[13px] text-fg-muted">{label}</span>
      <span className={`text-[13px] font-mono shrink-0 ${color}`}>{value}</span>
    </div>
  );
  const RuleRow = ({ pass, label, value, color }: { pass: boolean | null; label: string; value: ReactNode; color: string }) => (
    <div className="px-4 py-2.5 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <StatusIcon pass={pass} />
        <span className="text-[13px] text-fg-muted">{label}</span>
      </div>
      <span className={`text-[13px] font-mono shrink-0 ${color}`}>{value}</span>
    </div>
  );

  return (
    <div className="rounded-card border border-line overflow-hidden bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium cursor-pointer"
      >
        <span className={headTone}>Pass / Fail — BZZ</span>
        <IconChevron size={14} className={`text-fg-faint transition-transform ${open ? "rotate-90" : ""} xl:hidden`} />
      </button>
      <div className={`divide-y divide-line border-t border-line ${open ? "" : "hidden xl:block"}`}>
        <AvgRow label="Normal Modules avg" value={normalAvg !== null ? normalAvg.toFixed(1) : "—"} color={normalAvg !== null ? getAvgColor(normalAvg) : "text-fg-faint"} />
        <AvgRow label="ÜK Modules avg" value={ukAvg !== null ? ukAvg.toFixed(1) : "—"} color={ukAvg !== null ? getAvgColor(ukAvg) : "text-fg-faint"} />
        <RuleRow pass={avgPass} label="Final Average ≥ 4.0" value={finalAvg !== null ? finalAvg.toFixed(2) : "—"} color={finalAvg !== null ? (finalAvg >= 4 ? "text-subject-green" : "text-now") : "text-fg-faint"} />
        <RuleRow pass={ipaPass} label="IPA ≥ 4.0" value={ipaGrade !== null ? ipaGrade.toFixed(2) : "—"} color={ipaGrade !== null ? (ipaGrade >= 4 ? "text-subject-green" : "text-now") : "text-fg-faint"} />
      </div>
    </div>
  );
}
