"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess("Please check your email and click the verification link to activate your account.");
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
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Create account</h1>
            <p className="text-fg-muted mt-2 text-sm">Start tracking your grades with GradePoints</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-control bg-now-tint border border-now/40 text-now text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-control bg-subject-green/10 border border-subject-green/40 text-subject-green text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-fg-muted mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-fg-muted mb-1">
                Email
              </label>
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
              <label htmlFor="password" className="block text-sm font-medium text-fg-muted mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-fg-muted mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-fg hover:opacity-70 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
