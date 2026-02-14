import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { value, weight, description, date } = await request.json();

  const grade = await prisma.grade.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!grade) {
    return NextResponse.json({ error: "Grade not found" }, { status: 404 });
  }

  const updated = await prisma.grade.update({
    where: { id },
    data: {
      ...(value !== undefined && { value: parseFloat(value) }),
      ...(weight !== undefined && { weight: parseFloat(weight) }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const grade = await prisma.grade.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!grade) {
    return NextResponse.json({ error: "Grade not found" }, { status: 404 });
  }

  await prisma.grade.delete({ where: { id } });

  return NextResponse.json({ message: "Grade deleted" });
}
