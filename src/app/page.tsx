import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-fg mb-4">GradePoints</h1>
        <p className="text-lg sm:text-xl text-fg-muted mb-8">
          Track all your school grades in one place. Add subjects, log grades,
          and see your averages at a glance.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/register"
            className="px-6 py-2.5 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-surface hover:bg-hover text-fg font-medium rounded-control transition border border-line"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
