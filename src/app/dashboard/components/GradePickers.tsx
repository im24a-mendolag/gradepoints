"use client";

import { getGradeColor, blockNonNumericKeys, formatWeight } from "../utils";

export function calcGradeFromPoints(my: string, total: string): string {
  const m = parseFloat(my);
  const t = parseFloat(total);
  if (isNaN(m) || isNaN(t) || t <= 0) return "";
  return String(Math.round(((m / t) * 5 + 1) * 1000) / 1000);
}

export const GRADE_LABELS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
const WEIGHT_LABELS = [0, 0.5, 1, 1.5, 2, 2.5, 3];

const THUMB_PX = 16;

export function SliderLabels({ labels, min, max }: { labels: number[]; min: number; max: number }) {
  return (
    <div className="relative h-4">
      {labels.map((v) => {
        const ratio = (v - min) / (max - min);
        return (
          <span
            key={v}
            style={{ left: `calc(${ratio} * (100% - ${THUMB_PX}px) + ${THUMB_PX / 2}px)` }}
            className="absolute -translate-x-1/2 text-xs text-neutral-500 leading-none"
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
        <span className={`inline-flex items-center justify-center w-14 h-11 rounded-lg font-bold text-base border shrink-0 transition ${valid ? getGradeColor(parsed) : "border-neutral-700 bg-neutral-800 text-neutral-500"}`}>
          {valid ? parsed : "—"}
        </span>
        <input
          type="number"
          min="1"
          max="6"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => blockNonNumericKeys(e)}
          className="flex-1 px-3 h-11 rounded-lg border border-neutral-700 bg-neutral-800 text-base text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1–6"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`inline-flex items-center justify-center w-14 h-9 rounded-lg font-bold text-sm border shrink-0 transition ${valid ? getGradeColor(parsed) : "border-neutral-700 bg-neutral-800 text-neutral-500"}`}>
        {valid ? parsed : "—"}
      </span>
      <div className="flex-1 pb-1">
        <SliderLabels labels={GRADE_LABELS} min={1} max={6} />
        <input
          type="range"
          min="1"
          max="6"
          step="0.1"
          value={sliderVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 rounded-lg cursor-pointer accent-blue-500 bg-neutral-700"
        />
      </div>
      <input
        type="number"
        min="1"
        max="6"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => blockNonNumericKeys(e)}
        className="w-16 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500"
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

  const stepWeight = (delta: number) => {
    const current = valid ? parsed : 1;
    const next = Math.round(Math.min(3, Math.max(0, current + delta)) * 10) / 10;
    onChange(String(next));
  };

  if (noSlider) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center justify-center w-14 h-11 rounded-lg font-bold text-base border shrink-0 ${isZero ? "border-amber-700 bg-amber-900/20 text-amber-400" : "border-neutral-700 bg-neutral-800 text-neutral-300"}`}>
            ×{valid ? formatWeight(parsed) : "1"}
          </span>
          <button
            type="button"
            onClick={() => stepWeight(-0.5)}
            className="w-11 h-11 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 text-xl font-bold flex items-center justify-center active:bg-neutral-700 cursor-pointer"
          >
            −
          </button>
          <input
            type="number"
            min="0"
            max="3"
            step="0.5"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => blockNonNumericKeys(e)}
            className="flex-1 px-3 h-11 rounded-lg border border-neutral-700 bg-neutral-800 text-base text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="wt"
          />
          <button
            type="button"
            onClick={() => stepWeight(0.5)}
            className="w-11 h-11 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 text-xl font-bold flex items-center justify-center active:bg-neutral-700 cursor-pointer"
          >
            +
          </button>
        </div>
        {isZero && (
          <p className="mt-1.5 text-xs text-amber-400">Weight 0 — this grade won&apos;t count toward averages</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center justify-center w-14 h-9 rounded-lg font-bold text-sm border shrink-0 ${isZero ? "border-amber-700 bg-amber-900/20 text-amber-400" : "border-neutral-700 bg-neutral-800 text-neutral-300"}`}>
          ×{valid ? formatWeight(parsed) : "1"}
        </span>
        <div className="flex-1 pb-1">
          <SliderLabels labels={WEIGHT_LABELS} min={0} max={3} />
          <input
            type="range"
            min="0"
            max="3"
            step="0.1"
            value={sliderVal}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-2 rounded-lg cursor-pointer accent-blue-500 bg-neutral-700"
          />
        </div>
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => blockNonNumericKeys(e)}
          className="w-16 px-2 h-9 rounded-lg border border-neutral-700 bg-neutral-800 text-sm text-neutral-100 text-center outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="wt"
        />
      </div>
      {isZero && (
        <p className="mt-1.5 text-xs text-amber-400">Weight 0 — this grade won&apos;t count toward averages</p>
      )}
    </div>
  );
}
