import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 to-gray-900 px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-100 mb-4">
          Grade<span className="text-blue-500">Points</span>
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Track all your school grades in one place. Add subjects, log grades,
          and see your averages at a glance.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition shadow-lg shadow-blue-900/30"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition shadow-lg shadow-black/20 border border-gray-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
