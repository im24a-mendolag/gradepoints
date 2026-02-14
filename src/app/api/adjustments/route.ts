import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adjustments = await prisma.adjustment.findMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json(adjustments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { value, semester, subject } = await request.json();

  if (value === undefined || value === null || !semester || !subject) {
    return NextResponse.json(
      { error: "Value, semester, and subject are required" },
      { status: 400 }
    );
  }

  // Upsert: create or update the adjustment for this user/semester/subject
  const adjustment = await prisma.adjustment.upsert({
    where: {
      userId_semester_subject: {
        userId: session.user.id,
        semester,
        subject,
      },
    },
    update: { value: parseFloat(value) },
    create: {
      value: parseFloat(value),
      semester,
      subject,
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

  const { semester, subject } = await request.json();

  if (!semester || !subject) {
    return NextResponse.json(
      { error: "Semester and subject are required" },
      { status: 400 }
    );
  }

  try {
    await prisma.adjustment.delete({
      where: {
        userId_semester_subject: {
          userId: session.user.id,
          semester,
          subject,
        },
      },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Adjustment not found" }, { status: 404 });
  }
}
