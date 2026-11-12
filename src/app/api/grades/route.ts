import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidSubjectForSemester, isValidBzzSubject } from "@/lib/semesters";
import { badRequest, requireUser, round3, schoolFilter, validateGradeFields } from "@/lib/api";

export async function GET(request: Request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const semester = new URL(request.url).searchParams.get("semester");

  const grades = await prisma.grade.findMany({
    where: {
      userId,
      ...(semester && { semester: parseInt(semester) }),
      ...schoolFilter(request),
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(grades);
}

function subjectError(school: string, semester: number, subject: string): string | null {
  if (school === "BZZ") {
    return isValidBzzSubject(subject) ? null : "This module is not valid for BZZ";
  }
  if (semester < 1 || semester > 7) return "Invalid semester";
  if (!isValidSubjectForSemester(semester, subject)) {
    return "This subject is not available in this semester";
  }
  return null;
}

export async function POST(request: Request) {
  const { userId, error } = await requireUser({ rateLimit: true });
  if (error) return error;

  const { value, weight, description, date, semester, subject, school } = await request.json();
  const schoolValue = school || "KSH";

  if (value === undefined || value === null || !semester || !subject) {
    return badRequest("Grade value, semester, and subject are required");
  }

  const validationError =
    validateGradeFields({ value, weight, description, date }) ??
    subjectError(schoolValue, semester, subject);
  if (validationError) return badRequest(validationError);

  const grade = await prisma.grade.create({
    data: {
      value: round3(value),
      weight: weight !== undefined ? round3(weight) : 1,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      semester,
      subject,
      school: schoolValue,
      userId,
    },
  });

  return NextResponse.json(grade, { status: 201 });
}
