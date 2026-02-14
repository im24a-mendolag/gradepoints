import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSubjectForSemester } from "@/lib/semesters";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const semester = searchParams.get("semester");

  const where: { userId: string; semester?: number } = {
    userId: session.user.id,
  };

  if (semester) {
    where.semester = parseInt(semester);
  }

  const grades = await prisma.grade.findMany({
    where,
    orderBy: { date: "desc" },
  });

  return NextResponse.json(grades);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value, weight, description, date, semester, subject } = await request.json();

  if (value === undefined || value === null || !semester || !subject) {
    return NextResponse.json(
      { error: "Grade value, semester, and subject are required" },
      { status: 400 }
    );
  }

  if (value < 1 || value > 6) {
    return NextResponse.json(
      { error: "Grade must be between 1 and 6" },
      { status: 400 }
    );
  }

  if (semester < 1 || semester > 7) {
    return NextResponse.json(
      { error: "Invalid semester" },
      { status: 400 }
    );
  }

  if (!isValidSubjectForSemester(semester, subject)) {
    return NextResponse.json(
      { error: "This subject is not available in this semester" },
      { status: 400 }
    );
  }

  const grade = await prisma.grade.create({
    data: {
      value: parseFloat(value),
      weight: weight !== undefined ? parseFloat(weight) : 1,
      description: description || "",
      date: date ? new Date(date) : new Date(),
      semester,
      subject,
      userId: session.user.id,
    },
  });

  return NextResponse.json(grade, { status: 201 });
}
