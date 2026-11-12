"use client";

import { useState } from "react";
import { AuthShell, Field, Notice, SubmitButton, submitHandler } from "@/components/AuthForm";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = submitHandler(setError, setLoading, async () => {
    setSuccess("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) return data.error || "Something went wrong";
    setSuccess("Please check your email and click the verification link to activate your account.");
  });

  return (
    <AuthShell
      title="Create account"
      subtitle="Start tracking your grades with GradePoints"
      footer={{ text: "Already have an account?", href: "/login", link: "Sign in" }}
    >
      <Notice tone="error">{error}</Notice>
      <Notice tone="success">{success}</Notice>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field id="name" label="Name" type="text" value={name} onChange={setName} placeholder="Your name" />
        <Field id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="At least 6 characters"
          minLength={6}
        />
        <SubmitButton loading={loading} label="Create account" loadingLabel="Creating account..." />
      </form>
    </AuthShell>
  );
}
