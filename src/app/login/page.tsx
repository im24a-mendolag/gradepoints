"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { AuthShell, Field, Notice, SubmitButton, submitHandler } from "@/components/AuthForm";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = submitHandler(setError, setLoading, async () => {
    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      return result.error.includes("EMAIL_NOT_VERIFIED")
        ? "Please verify your email before signing in. Check your inbox for the verification link."
        : "Invalid email or password";
    }
    router.push("/dashboard");
    router.refresh();
  });

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your GradePoints account"
      footer={{ text: "Don't have an account?", href: "/register", link: "Create one" }}
    >
      <Notice tone="info">
        {searchParams.get("registered") &&
          "Account created! Please check your email and click the verification link before signing in."}
      </Notice>
      <Notice tone="success">
        {searchParams.get("verified") && "Email verified successfully! You can now sign in."}
      </Notice>
      <Notice tone="error">{error}</Notice>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
        />
        <SubmitButton loading={loading} label="Sign in" loadingLabel="Signing in..." />
      </form>
    </AuthShell>
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
