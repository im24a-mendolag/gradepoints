"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const registered = searchParams.get("registered");
  const verified = searchParams.get("verified");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
        } else {
          setError("Invalid email or password");
        }
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-card border border-line p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Welcome back</h1>
            <p className="text-fg-muted mt-2 text-sm">Sign in to your GradePoints account</p>
          </div>

          {registered && (
            <div className="mb-4 p-3 rounded-control bg-sunken border border-line text-fg-muted text-sm">
              Account created! Please check your email and click the verification link before signing in.
            </div>
          )}

          {verified && (
            <div className="mb-4 p-3 rounded-control bg-subject-green/10 border border-subject-green/40 text-subject-green text-sm">
              Email verified successfully! You can now sign in.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-control bg-now-tint border border-now/40 text-now text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-fg-muted mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-fg-muted mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-fg-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-fg hover:opacity-70 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-line border-t-fg"></div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
