"use client";

import type { ReactNode } from "react";
import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";
import type { WeightMode } from "../lib/gradeAverage";

export function calcGradeFromPoints(my: string, total: string): string {
  const m = parseFloat(my);
  const t = parseFloat(total);
  if (isNaN(m) || isNaN(t) || t <= 0) return "";
  return String(Math.round(((m / t) * 5 + 1) * 1000) / 1000);
}

export const GRADE_LABELS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const WEIGHT_LABELS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

const THUMB_PX = 16;

const numInput =
  "rounded-control border border-line bg-sunken text-fg text-center outline-none focus:ring-2 focus:ring-line-strong focus:border-transparent";
const emptyBadge = "border-line bg-sunken text-fg-faint";
const zeroBadge = "border-subject-amber/40 bg-subject-amber/10 text-subject-amber";
const neutralBadge = "border-line bg-sunken text-fg-muted";

export function SliderLabels({ labels, min, max }: { labels: number[]; min: number; max: number }) {
  return (
    <div className="relative h-4">
      {labels.map((v) => {
        const ratio = (v - min) / (max - min);
        return (
          <span
            key={v}
            style={{ left: `calc(${ratio} * (100% - ${THUMB_PX}px) + ${THUMB_PX / 2}px)` }}
            className="absolute -translate-x-1/2 text-[11px] font-mono text-fg-faint leading-none"
          >
            {v}
          </span>
        );
      })}
    </div>
  );
}

export function GradePicker({ value, onChange, noSlider }: { value: string; onChange: (v: string) => void; noSlider?: boolean }) {
  const parsed = parseFloat(value);
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 6;
  const sliderVal = valid ? Math.min(6, Math.max(1, parsed)) : 1;

  if (noSlider) {
    return (
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-14 h-11 rounded-control font-mono text-base border shrink-0 transition ${valid ? getGradeColor(parsed) : emptyBadge}`}>
          {valid ? parsed : "—"}
        </span>
        <input
          type="number" min="1" max="6" step="0.1" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => blockNonNumericKeys(e)}
          className={`flex-1 px-3 h-11 text-base ${numInput}`}
          placeholder="1–6"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center justify-center w-14 h-9 rounded-control font-mono text-sm border shrink-0 transition ${valid ? getGradeColor(parsed) : emptyBadge}`}>
        {valid ? parsed : "—"}
      </span>
      <div className="flex-1 pb-1">
        <SliderLabels labels={GRADE_LABELS} min={1} max={6} />
        <input
          type="range" min="1" max="6" step="0.1" value={sliderVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 rounded-control cursor-pointer accent-fg bg-line"
        />
      </div>
      <input
        type="number" min="1" max="6" step="any" value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className={`w-16 px-2 h-9 text-sm ${numInput}`}
        placeholder="1–6"
      />
    </div>
  );
}

export function WeightPicker({ value, onChange, noSlider }: { value: string; onChange: (v: string) => void; noSlider?: boolean }) {
  const parsed = parseFloat(value);
  const valid = !isNaN(parsed) && parsed >= 0;
  const sliderVal = valid ? Math.min(3, Math.max(0, parsed)) : 1;
  const isZero = valid && parsed === 0;

  if (noSlider) {
    const stepWeight = (delta: number) => {
      const current = valid ? parsed : 1;
      const next = Math.round(Math.min(3, Math.max(0, current + delta)) * 10) / 10;
      onChange(String(next));
    };
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-14 h-11 rounded-control font-mono text-base border shrink-0 ${isZero ? zeroBadge : neutralBadge}`}>
            ×{valid ? formatWeight(parsed) : "1"}
          </span>
          <button type="button" onClick={() => stepWeight(-0.5)}
            className="w-11 h-11 rounded-control border border-line bg-sunken text-fg text-xl flex items-center justify-center active:bg-hover cursor-pointer">
            −
          </button>
          <input
            type="number" min="0" max="3" step="0.5" value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => blockNonNumericKeys(e)}
            className={`flex-1 px-3 h-11 text-base ${numInput}`}
            placeholder="wt"
          />
          <button type="button" onClick={() => stepWeight(0.5)}
            className="w-11 h-11 rounded-control border border-line bg-sunken text-fg text-xl flex items-center justify-center active:bg-hover cursor-pointer">
            +
          </button>
        </div>
        {isZero && <p className="mt-1.5 text-xs text-subject-amber">Weight 0 — this grade won&apos;t count toward averages</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-14 h-9 rounded-control font-mono text-sm border shrink-0 ${isZero ? zeroBadge : neutralBadge}`}>
          ×{valid ? formatWeight(parsed) : "1"}
        </span>
        <div className="flex-1 pb-1">
          <SliderLabels labels={WEIGHT_LABELS} min={0} max={3} />
          <input
            type="range" min="0" max="3" step="0.1" value={sliderVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-2 rounded-control cursor-pointer accent-fg bg-line"
          />
        </div>
        <input
          type="number" min="0" step="any" value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => blockNonNumericKeys(e)}
          className={`w-16 px-2 h-9 text-sm ${numInput}`}
          placeholder="wt"
        />
      </div>
      {isZero && <p className="mt-1.5 text-xs text-subject-amber">Weight 0 — this grade won&apos;t count toward averages</p>}
    </div>
  );
}

const toggleBtn = (active: boolean) =>
  `px-2.5 py-1 rounded-control transition cursor-pointer ${active ? "bg-ink text-on-ink" : "text-fg-muted hover:text-fg"}`;

/** Field label on the left with its mode toggle (if any) on the right, above the input. */
export function FieldHeader({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <span className="text-[11px] font-medium text-fg-muted">{label}</span>
      {children}
    </div>
  );
}

/** Small two-or-more-way toggle (e.g. 1–6 / Points, Weight / % of subject). */
export function ModeToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-control bg-sunken p-0.5 text-xs w-fit">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={toggleBtn(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

const PERCENT_LABELS = [0, 25, 50, 75, 100];

/** Percentage (0–100] of the subject's grade, as badge + slider + number input. */
function PercentPicker({ value, onChange, noSlider }: { value: string; onChange: (v: string) => void; noSlider?: boolean }) {
  const parsed = parseFloat(value);
  const valid = parsed > 0 && parsed <= 100;
  const h = noSlider ? "h-11 text-base" : "h-9 text-sm";

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center justify-center w-14 ${h} rounded-control font-mono border shrink-0 ${valid ? neutralBadge : emptyBadge}`}>
        {valid ? `${formatWeight(parsed)}%` : "—"}
      </span>
      {!noSlider && (
        <div className="flex-1 pb-1">
          <SliderLabels labels={PERCENT_LABELS} min={0} max={100} />
          <input
            type="range" min="0" max="100" step="5" value={valid ? parsed : 0}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-2 rounded-control cursor-pointer accent-fg bg-line"
          />
        </div>
      )}
      <input
        type="number" min="0" max="100" step="any" value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className={`${noSlider ? "flex-1 px-3" : "w-16 px-2"} ${h} ${numInput}`}
        placeholder="%"
        aria-label="Percent of subject grade"
      />
    </div>
  );
}

const COUNTING_MODES: { value: WeightMode; label: string }[] = [
  { value: "weight", label: "Weight" },
  { value: "percent", label: "% of subject" },
];

/** How a grade counts: relative weight, or a fixed % of the subject's grade. */
export function CountingPicker({
  label = "Weight",
  mode,
  onModeChange,
  weight,
  onWeightChange,
  percent,
  onPercentChange,
  noSlider,
}: {
  label?: string;
  mode: WeightMode;
  onModeChange: (m: WeightMode) => void;
  weight: string;
  onWeightChange: (v: string) => void;
  percent: string;
  onPercentChange: (v: string) => void;
  noSlider?: boolean;
}) {
  return (
    <div>
      <FieldHeader label={label}>
        <ModeToggle options={COUNTING_MODES} value={mode} onChange={onModeChange} />
      </FieldHeader>
      {mode === "weight" ? (
        <WeightPicker value={weight} onChange={onWeightChange} noSlider={noSlider} />
      ) : (
        <>
          <PercentPicker value={percent} onChange={onPercentChange} noSlider={noSlider} />
          <p className="mt-1.5 text-xs text-fg-faint">Counts this share of the subject&apos;s grade; weighted grades share the rest.</p>
        </>
      )}
    </div>
  );
}
