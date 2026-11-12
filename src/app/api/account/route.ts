import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { badRequest, requireUser } from "@/lib/api";

type User = NonNullable<Awaited<ReturnType<typeof prisma.user.findUnique>>>;
type Updates = { name?: string; password?: string };

const userNotFound = () => NextResponse.json({ error: "User not found" }, { status: 404 });

function nameUpdate(name: unknown): Updates | string {
  if (name === undefined) return {};
  if (typeof name !== "string" || name.trim().length === 0) return "Name cannot be empty";
  return { name: name.trim() };
}

async function passwordUpdate(
  user: User,
  currentPassword: string | undefined,
  newPassword: string | undefined,
): Promise<Updates | NextResponse> {
  if (!currentPassword && !newPassword) return {};
  if (!currentPassword || !newPassword) {
    return badRequest("Both current password and new password are required");
  }
  if (newPassword.length < 6) return badRequest("New password must be at least 6 characters");

  if (!(await bcryptjs.compare(currentPassword, user.password))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
  }
  return { password: await bcryptjs.hash(newPassword, 12) };
}

export async function PUT(request: Request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { name, currentPassword, newPassword } = await request.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return userNotFound();

  const nameResult = nameUpdate(name);
  if (typeof nameResult === "string") return badRequest(nameResult);

  const passwordResult = await passwordUpdate(user, currentPassword, newPassword);
  if (passwordResult instanceof NextResponse) return passwordResult;

  const updates = { ...nameResult, ...passwordResult };
  if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

  await prisma.user.update({ where: { id: userId }, data: updates });

  return NextResponse.json({ message: "Account updated successfully" });
}

export async function DELETE(request: Request) {
  const { userId, error } = await requireUser();
  if (error) return error;

  const { password } = await request.json();
  if (!password) return badRequest("Password is required to delete your account");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return userNotFound();

  if (!(await bcryptjs.compare(password, user.password))) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 403 });
  }

  // Clean up verification tokens for this email
  await prisma.verificationToken.deleteMany({ where: { email: user.email } });

  // Cascade-deletes grades and adjustments
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ message: "Account deleted successfully" });
}
