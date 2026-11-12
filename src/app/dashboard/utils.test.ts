import { describe, expect, it, vi } from "vitest";
import type React from "react";
import {
  blockNonNumericKeys,
  formatWeight,
  getAvgColor,
  getGradeColor,
  getGradeHex,
  roundTo1dp,
  roundToHalf,
  subjectColorHex,
  subjectColorVar,
  toDateInputString,
} from "./utils";
import { calcGradeFromPoints } from "./components/GradePickers";

const key = (k: string, mods: Partial<{ ctrlKey: boolean; metaKey: boolean }> = {}) => {
  const e = { key: k, ctrlKey: false, metaKey: false, preventDefault: vi.fn(), ...mods };
  return e as unknown as React.KeyboardEvent<HTMLInputElement> & { preventDefault: ReturnType<typeof vi.fn> };
};

describe("blockNonNumericKeys", () => {
  it("allows digits, navigation and shortcuts but blocks letters", () => {
    for (const k of ["5", ".", "Backspace", "ArrowLeft"]) {
      const e = key(k);
      blockNonNumericKeys(e);
      expect(e.preventDefault).not.toHaveBeenCalled();
    }
    const letter = key("e");
    blockNonNumericKeys(letter);
    expect(letter.preventDefault).toHaveBeenCalled();

    const paste = key("v", { ctrlKey: true });
    blockNonNumericKeys(paste);
    expect(paste.preventDefault).not.toHaveBeenCalled();
  });

  it("blocks minus unless negatives are allowed", () => {
    const blocked = key("-");
    blockNonNumericKeys(blocked);
    expect(blocked.preventDefault).toHaveBeenCalled();
    const allowed = key("-");
    blockNonNumericKeys(allowed, { allowNegative: true });
    expect(allowed.preventDefault).not.toHaveBeenCalled();
  });
});

describe("formatting helpers", () => {
  it("maps grades to colour classes and hex", () => {
    expect(getGradeColor(6)).toBe("grade-badge-60");
    expect(getAvgColor(4.2)).toBe("grade-fg-40");
    expect(getGradeHex(0.5)).toBe("#e5484d");
  });

  it("colours known subjects and hashes unknown ones", () => {
    expect(subjectColorVar("Math")).toBe("var(--subject-teal)");
    expect(subjectColorHex("Math")).toBe("#0d9488");
    expect(subjectColorHex("431")).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("rounds and formats numbers and dates", () => {
    expect(formatWeight(0.333)).toBe("0.33");
    expect(roundToHalf(4.74)).toBe(4.5);
    expect(roundTo1dp(1.26)).toBe(1.3);
    expect(toDateInputString("2025-03-04T10:00:00Z")).toBe("2025-03-04");
    expect(toDateInputString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("converts points to a grade", () => {
    expect(calcGradeFromPoints("10", "20")).toBe("3.5");
    expect(calcGradeFromPoints("x", "20")).toBe("");
    expect(calcGradeFromPoints("10", "0")).toBe("");
  });
});
