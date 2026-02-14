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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 to-neutral-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900 rounded-2xl shadow-xl shadow-black/20 border border-neutral-800 p-8 text-center">
          {isSuccess ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-900/30 border-2 border-green-700 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-3xl">✓</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-100 mb-2">Email Verified!</h1>
              <p className="text-neutral-400 mb-6">
                Your account has been verified. You can now sign in.
              </p>
              <Link
                href="/login?verified=true"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
              >
                Sign in
              </Link>
            </>
          ) : isError ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-900/30 border-2 border-red-700 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-3xl">✗</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-100 mb-2">Verification Failed</h1>
              <p className="text-neutral-400 mb-6">
                {message || "The verification link is invalid or has expired."}
              </p>
              <Link
                href="/register"
                className="inline-block px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg transition border border-neutral-700"
              >
                Try again
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-neutral-100 mb-2">Check Your Email</h1>
              <p className="text-neutral-400 mb-6">
                We&apos;ve sent a verification link to your email address.
                Click the link to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium rounded-lg transition border border-neutral-700"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 to-neutral-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
