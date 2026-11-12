import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { badRequest, requireUser, round3, validateGradeFields } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/** Returns true when the grade exists and belongs to the user. */
async function ownsGrade(id: string, userId: string) {
  const grade = await prisma.grade.findFirst({ where: { id, userId } });
  return grade !== null;
}

const notFound = () => NextResponse.json({ error: "Grade not found" }, { status: 404 });

export async function PUT(request: Request, { params }: Params) {
  const { userId, error } = await requireUser({ rateLimit: true });
  if (error) return error;

  const { id } = await params;
  const { value, weight, description, date } = await request.json();

  const validationError = validateGradeFields({ value, weight, description, date });
  if (validationError) return badRequest(validationError);

  if (!(await ownsGrade(id, userId))) return notFound();

  const updated = await prisma.grade.update({
    where: { id },
    data: {
      ...(value !== undefined && { value: round3(value) }),
      ...(weight !== undefined && { weight: round3(weight) }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { userId, error } = await requireUser({ rateLimit: true });
  if (error) return error;

  const { id } = await params;
  if (!(await ownsGrade(id, userId))) return notFound();

  await prisma.grade.delete({ where: { id } });

  return NextResponse.json({ message: "Grade deleted" });
}
