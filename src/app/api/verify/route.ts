import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/email";
import { rateLimitByIp } from "@/lib/rate-limit";

/**
 * GET /api/verify?token=xxx
 * Verifies a user's email using the token from the verification link.
 * Redirects to /verify page with success or error status.
 */
export async function GET(request: Request) {
  const { allowed } = rateLimitByIp(request, { maxRequests: 10, windowMs: 60_000 });
  if (!allowed) {
    return NextResponse.redirect(new URL("/verify?status=error&message=Too+many+requests", request.url));
  }

  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify?status=error&message=Missing+token", request.url));
  }

  const result = await verifyToken(token);

  if (result.success) {
    return NextResponse.redirect(
      new URL("/verify?status=success", request.url)
    );
  } else {
    return NextResponse.redirect(
      new URL(`/verify?status=error&message=${encodeURIComponent(result.error || "Verification failed")}`, request.url)
    );
  }
}
