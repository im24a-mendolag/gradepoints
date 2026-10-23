import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
        <p className="text-sm text-fg-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 rounded-control bg-ink text-on-ink text-sm font-medium transition hover:opacity-90"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
