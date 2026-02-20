import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, currentPassword, newPassword } = await request.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updates: { name?: string; password?: string } = {};

  if (name !== undefined) {
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updates.name = name.trim();
  }

  if (currentPassword || newPassword) {
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required" },
        { status: 400 },
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters" },
        { status: 400 },
      );
    }

    const passwordMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    updates.password = await bcryptjs.hash(newPassword, 12);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
  });

  return NextResponse.json({ message: "Account updated successfully" });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { password } = await request.json();
  if (!password) {
    return NextResponse.json({ error: "Password is required to delete your account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordMatch = await bcryptjs.compare(password, user.password);
  if (!passwordMatch) {
    return NextResponse.json({ error: "Password is incorrect" }, { status: 403 });
  }

  // Clean up verification tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { email: user.email },
  });

  // Cascade-deletes grades and adjustments
  await prisma.user.delete({
    where: { id: session.user.id },
  });

  return NextResponse.json({ message: "Account deleted successfully" });
}
