"use client";

import { useState } from "react";
import { blockNonNumericKeys, getGradeColor } from "../utils";
import type { WeightMode } from "../lib/gradeAverage";
import { CountingPicker, FieldHeader, GradePicker, ModeToggle, calcGradeFromPoints } from "./GradePickers";

export const textInput =
  "px-3 py-2 rounded-control border border-line bg-sunken text-sm text-fg outline-none focus:ring-2 focus:ring-line-strong focus:border-transparent";

export interface GradeFormValues {
  value: string;
  mode: WeightMode;
  weight: string;
  percent: string;
  description: string;
  date: string;
}

export interface GradeFormSetters {
  setValue: (v: string) => void;
  setMode: (m: WeightMode) => void;
  setWeight: (v: string) => void;
  setPercent: (v: string) => void;
  setDescription: (v: string) => void;
  setDate: (v: string) => void;
}

type InputMode = "grade" | "points";
const INPUT_MODES: { value: InputMode; label: string }[] = [
  { value: "grade", label: "1–6" },
  { value: "points", label: "Points" },
];

function PointsInput({ value, onGradeChange }: { value: string; onGradeChange: (grade: string) => void }) {
  const [points, setPoints] = useState({ my: "", total: "" });
  const update = (my: string, total: string) => {
    setPoints({ my, total });
    onGradeChange(calcGradeFromPoints(my, total));
  };
  const cls = `w-24 h-9 text-center ${textInput}`;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input type="number" min="0" step="any" value={points.my} onChange={(e) => update(e.target.value, points.total)} onKeyDown={(e) => blockNonNumericKeys(e)} className={cls} placeholder="My pts" />
      <span className="text-fg-faint text-sm">/</span>
      <input type="number" min="0" step="any" value={points.total} onChange={(e) => update(points.my, e.target.value)} onKeyDown={(e) => blockNonNumericKeys(e)} className={cls} placeholder="Max pts" />
      {value && <span className={`inline-flex items-center justify-center px-3 h-9 rounded-control font-mono text-sm border ${getGradeColor(parseFloat(value))}`}>= {parseFloat(value).toFixed(3)}</span>}
    </div>
  );
}

/**
 * The fields of one grade — Grade (1–6 or from points), Weight (or % of subject),
 * Description and Date — shared by the add panel and the inline edit form.
 * `onSubmit` runs when Enter is pressed in the description.
 */
export default function GradeFormFields({
  values,
  set,
  noSlider,
  onSubmit,
}: {
  values: GradeFormValues;
  set: GradeFormSetters;
  noSlider?: boolean;
  onSubmit?: () => void;
}) {
  const [inputMode, setInputMode] = useState<InputMode>("grade");

  const switchInputMode = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === "points") set.setValue("");
  };

  return (
    <div className="space-y-3">
      <div>
        <FieldHeader label="Grade">
          <ModeToggle options={INPUT_MODES} value={inputMode} onChange={switchInputMode} />
        </FieldHeader>
        {inputMode === "grade" ? (
          <GradePicker value={values.value} onChange={set.setValue} noSlider={noSlider} />
        ) : (
          <PointsInput value={values.value} onGradeChange={set.setValue} />
        )}
      </div>
      <CountingPicker
        mode={values.mode} onModeChange={set.setMode}
        weight={values.weight} onWeightChange={set.setWeight}
        percent={values.percent} onPercentChange={set.setPercent}
        noSlider={noSlider}
      />
      <div className="flex gap-3">
        <div className="flex-1">
          <FieldHeader label="Description (optional)" />
          <input type="text" value={values.description} onChange={(e) => set.setDescription(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSubmit?.(); }} className={`w-full ${textInput}`} placeholder="e.g. Midterm exam" />
        </div>
        <div>
          <FieldHeader label="Date" />
          <input type="date" value={values.date} onChange={(e) => set.setDate(e.target.value)} className={`${textInput} font-mono`} />
        </div>
      </div>
    </div>
  );
}
