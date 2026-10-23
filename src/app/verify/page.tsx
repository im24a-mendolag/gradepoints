"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

/**
 * Landing page after clicking the email verification link.
 * The email link points to /api/verify?token=xxx which redirects here
 * with ?status=success or ?status=error&message=...
 */
function VerifyContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const message = searchParams.get("message");

  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-card border border-line p-8 text-center">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 rounded-full bg-subject-green/10 border border-subject-green/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-subject-green text-3xl">✓</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg mb-2">Email Verified!</h1>
              <p className="text-fg-muted mb-6 text-sm">Your account has been verified. You can now sign in.</p>
              <Link
                href="/login?verified=true"
                className="inline-block px-6 py-3 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90"
              >
                Sign in
              </Link>
            </>
          ) : isError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-now-tint border border-now/40 flex items-center justify-center mx-auto mb-4">
                <span className="text-now text-3xl">✗</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-fg mb-2">Verification Failed</h1>
              <p className="text-fg-muted mb-6 text-sm">{message || "The verification link is invalid or has expired."}</p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-surface hover:bg-hover text-fg font-medium rounded-control transition border border-line"
              >
                Try again
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-fg mb-2">Check Your Email</h1>
              <p className="text-fg-muted mb-6 text-sm">
                We&apos;ve sent a verification link to your email address.
                Click the link to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-surface hover:bg-hover text-fg font-medium rounded-control transition border border-line"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
