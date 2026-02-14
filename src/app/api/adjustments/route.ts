import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const school = searchParams.get("school"); // optional filter

  const where: { userId: string; school?: string } = {
    userId: session.user.id,
  };
  if (school) {
    where.school = school;
  }

  const adjustments = await prisma.adjustment.findMany({
    where,
  });

  return NextResponse.json(adjustments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value, semester, subject, school } = await request.json();
  const schoolValue = school || "KSH";

  if (value === undefined || value === null || !semester || !subject) {
    return NextResponse.json(
      { error: "Value, semester, and subject are required" },
      { status: 400 }
    );
  }

  // Upsert: create or update the adjustment for this user/semester/subject/school
  const adjustment = await prisma.adjustment.upsert({
    where: {
      userId_semester_subject_school: {
        userId: session.user.id,
        semester,
        subject,
        school: schoolValue,
      },
    },
    update: { value: parseFloat(value) },
    create: {
      value: parseFloat(value),
      semester,
      subject,
      school: schoolValue,
      userId: session.user.id,
    },
  });

  return NextResponse.json(adjustment, { status: 200 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { semester, subject, school } = await request.json();
  const schoolValue = school || "KSH";

  if (!semester || !subject) {
    return NextResponse.json(
      { error: "Semester and subject are required" },
      { status: 400 }
    );
  }

  try {
    await prisma.adjustment.delete({
      where: {
        userId_semester_subject_school: {
          userId: session.user.id,
          semester,
          subject,
          school: schoolValue,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Adjustment not found" }, { status: 404 });
  }
}
