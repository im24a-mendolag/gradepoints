import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Grade<span className="text-blue-600">Points</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track all your school grades in one place. Add subjects, log grades,
          and see your averages at a glance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-lg shadow-blue-200"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition shadow-lg shadow-gray-200 border border-gray-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
