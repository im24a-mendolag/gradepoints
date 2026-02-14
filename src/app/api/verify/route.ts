import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/email";

/**
 * GET /api/verify?token=xxx
 * Verifies a user's email using the token from the verification link.
 * Redirects to /verify page with success or error status.
 */
export async function GET(request: Request) {
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
