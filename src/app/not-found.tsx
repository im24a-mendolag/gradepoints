import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-neutral-100">Page not found</h1>
        <p className="text-sm text-neutral-400">The page you're looking for doesn't exist.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
