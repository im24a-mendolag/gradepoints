import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, requireUser, schoolFilter } from "@/lib/api";

export async function GET(request: Request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const adjustments = await prisma.adjustment.findMany({
    where: { userId, ...schoolFilter(request) },
  });

  return NextResponse.json(adjustments);
}

/** Composite unique key for a user's adjustment in one semester/subject/school. */
function adjustmentKey(userId: string, semester: number, subject: string, school: string) {
  return { userId_semester_subject_school: { userId, semester, subject, school } };
}

export async function POST(request: Request) {
  const { userId, error } = await requireUser({ rateLimit: true });
  if (error) return error;

  const { value, semester, subject, school } = await request.json();
  const schoolValue = school || "KSH";

  if (value === undefined || value === null || !semester || !subject) {
    return badRequest("Value, semester, and subject are required");
  }

  // Upsert: create or update the adjustment for this user/semester/subject/school
  const adjustment = await prisma.adjustment.upsert({
    where: adjustmentKey(userId, semester, subject, schoolValue),
    update: { value: parseFloat(value) },
    create: {
      value: parseFloat(value),
      semester,
      subject,
      school: schoolValue,
      userId,
    },
  });

  return NextResponse.json(adjustment, { status: 200 });
}

export async function DELETE(request: Request) {
  const { userId, error } = await requireUser({ rateLimit: true });
  if (error) return error;

  const { semester, subject, school } = await request.json();

  if (!semester || !subject) {
    return badRequest("Semester and subject are required");
  }

  try {
    await prisma.adjustment.delete({
      where: adjustmentKey(userId, semester, subject, school || "KSH"),
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Adjustment not found" }, { status: 404 });
  }
}
