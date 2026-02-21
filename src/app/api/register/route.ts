import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { allowed } = rateLimitByIp(request, { maxRequests: 5, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        await sendVerificationEmail(email);
      }
      return NextResponse.json(
        { message: "If this email is not already registered, you will receive a verification email shortly." },
        { status: 200 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
      },
    });

    // Send verification email
    await sendVerificationEmail(email);

    return NextResponse.json(
      { message: "Please check your email and click the verification link to activate your account." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
