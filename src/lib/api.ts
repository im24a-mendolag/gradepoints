import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";

type AuthResult =
  | { userId: string; error?: undefined }
  | { userId?: undefined; error: NextResponse };

/**
 * Resolves the signed-in user's id, or an error response to return as-is
 * (401 when signed out, 429 when `rateLimit` is set and the user is over the limit).
 */
export async function requireUser({ rateLimit = false } = {}): Promise<AuthResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (rateLimit && !(await checkRateLimit(userId))) {
    return { error: NextResponse.json({ error: "Too many requests, slow down" }, { status: 429 }) };
  }
  return { userId };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Optional `?school=` filter shared by the list endpoints. */
export function schoolFilter(request: Request) {
  const school = new URL(request.url).searchParams.get("school");
  return school ? { school } : {};
}

/** Rounds a numeric input to 3 decimals. */
export function round3(n: string | number) {
  return Math.round(parseFloat(String(n)) * 1000) / 1000;
}

interface GradeFields {
  value?: unknown;
  weight?: unknown;
  /** Share (0–100] of the subject's grade, or null to make the grade weight-based again. */
  percent?: unknown;
  description?: unknown;
  date?: unknown;
}

const MIN_DATE = new Date("2000-01-01");
const MAX_DATE = new Date("2100-01-01");

function invalidNumber(v: unknown, min: number, max = Infinity) {
  const n = parseFloat(String(v));
  return isNaN(n) || n < min || n > max;
}

function invalidDate(v: unknown) {
  const d = new Date(v as string);
  return isNaN(d.getTime()) || d < MIN_DATE || d > MAX_DATE;
}

function invalidPercent(v: unknown) {
  if (v === null) return false; // null clears the percentage
  const n = parseFloat(String(v));
  return isNaN(n) || n <= 0 || n > 100;
}

/** Each optional field's check and the message returned when a provided value fails it. */
const GRADE_CHECKS: [keyof GradeFields, (v: unknown) => boolean, string][] = [
  ["value", (v) => invalidNumber(v, 1, 6), "Grade must be between 1 and 6"],
  ["weight", (v) => invalidNumber(v, 0), "Weight must be a non-negative number"],
  ["percent", invalidPercent, "Percent must be greater than 0 and at most 100"],
  ["description", (v) => typeof v !== "string" || v.length > 500, "Description must be a string under 500 characters"],
  ["date", invalidDate, "Invalid date"],
];

/** Validates the optional grade fields; returns an error message or null. */
export function validateGradeFields(fields: GradeFields): string | null {
  for (const [key, invalid, message] of GRADE_CHECKS) {
    if (fields[key] !== undefined && invalid(fields[key])) return message;
  }
  return null;
}

/** Percent as stored: rounded to 3 decimals, or null for weight-based grades. */
export function percentValue(v: unknown): number | null {
  return v === null || v === undefined || v === "" ? null : round3(v as string | number);
}
