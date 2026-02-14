import { Resend } from "resend";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "GradePoints <onboarding@resend.dev>";

/**
 * Generates a random verification token, saves it to the database,
 * and sends a verification email to the given address.
 * @param email - The user's email address.
 * @returns The created verification token record.
 */
export async function sendVerificationEmail(email: string) {
  // Delete any existing tokens for this email (one by one to avoid transactions)
  const existingTokens = await prisma.verificationToken.findMany({ where: { email } });
  for (const t of existingTokens) {
    await prisma.verificationToken.delete({ where: { id: t.id } });
  }

  // Create a new token that expires in 24 hours
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const verificationToken = await prisma.verificationToken.create({
    data: { token, email, expiresAt },
  });

  const baseUrl = process.env.NEXTAUTH_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const verifyUrl = `${baseUrl}/api/verify?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your GradePoints account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
        <div style="padding: 32px 32px 0; text-align: center;">
          <h1 style="font-size: 24px; color: #f5f5f5; margin: 0;">
            Grade<span style="color: #3b82f6;">Points</span>
          </h1>
        </div>
        <div style="padding: 24px 32px 32px;">
          <div style="background: #171717; border: 1px solid #404040; border-radius: 12px; padding: 32px;">
            <h2 style="font-size: 18px; color: #f5f5f5; margin: 0 0 12px;">Verify your email</h2>
            <p style="color: #a3a3a3; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              Click the button below to verify your email address and activate your account.
              This link expires in 24 hours.
            </p>
            <a href="${verifyUrl}" style="display: inline-block; background: #3b82f6; color: #ffffff; font-weight: 600; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
              Verify Email
            </a>
            <p style="color: #737373; font-size: 12px; margin-top: 24px;">
              If you didn't create a GradePoints account, you can safely ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  });

  return verificationToken;
}

/**
 * Validates a verification token: checks existence and expiry.
 * If valid, marks the user's email as verified and deletes the token.
 * @param token - The token string from the verification URL.
 * @returns An object with `success` and optional `error` message.
 */
export async function verifyToken(token: string): Promise<{ success: boolean; error?: string }> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return { success: false, error: "Invalid or expired verification link." };
  }

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } });
    return { success: false, error: "This verification link has expired. Please register again." };
  }

  // Mark user as verified (use update with unique email to avoid transactions)
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: true },
  });

  // Clean up token
  await prisma.verificationToken.delete({ where: { id: record.id } });

  return { success: true };
}
