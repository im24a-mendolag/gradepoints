import Link from "next/link";

export const metadata = { title: "GradePoints – Install Extension" };

export default function ExtensionPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-300 transition mb-6 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold mb-2">
            Grade<span className="text-blue-500">Points</span> Importer
          </h1>
          <p className="text-neutral-400">
            A browser extension that imports your grades directly from{" "}
            <span className="text-neutral-200">intranet.tam.ch</span> into GradePoints — no copy-pasting needed.
          </p>
        </div>

        {/* Firefox — primary CTA */}
        <div className="mb-12 p-6 rounded-2xl border border-orange-900/50 bg-orange-950/20">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🦊</span>
            <h2 className="text-lg font-semibold">Firefox</h2>
            <span className="ml-1 text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-800/50 px-2 py-0.5 rounded-full">
              One-click install
            </span>
          </div>
          <p className="text-sm text-neutral-400 mb-5">
            Click the button — Firefox will show an install prompt.
          </p>
          <a
            href="/gradepoints-extension.xpi"
            className="inline-flex items-center gap-2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl transition text-base"
          >
            Install for Firefox
          </a>
        </div>

        {/* Chrome */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🟡</span>
            <h2 className="text-lg font-semibold">Chrome</h2>
          </div>
          <p className="text-sm text-neutral-400 mb-5">
            Chrome requires loading the extension manually in developer mode.
          </p>
        </div>

        {/* Chrome step 1 — download */}
        <div className="mb-8 p-5 rounded-xl border border-neutral-800 bg-neutral-900">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Step 1 — Download</p>
          <a
            href="/gradepoints-extension.zip"
            download
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition text-base"
          >
            Download gradepoints-extension.zip
          </a>
        </div>

        {/* Chrome steps 2-5 */}
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900 mb-4">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">Step 2 — Load in Chrome</p>
          <ol className="space-y-4">
            {[
              <>Unzip the file anywhere on your computer.</>,
              <>Go to <code className="bg-neutral-800 px-1.5 py-0.5 rounded text-blue-300 text-xs">chrome://extensions</code> in your address bar.</>,
              <>Enable <strong className="text-neutral-200">Developer mode</strong> using the toggle in the top-right corner.</>,
              <>Click <strong className="text-neutral-200">Load unpacked</strong> and select the unzipped folder.</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold text-neutral-300">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-300 pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-12 text-xs text-neutral-500 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3">
          The extension stays installed permanently. If Chrome warns you about Developer mode extensions at startup, click <strong className="text-neutral-400">Keep</strong>.
        </div>

        {/* How to use */}
        <div className="border-t border-neutral-800 mb-10" />
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">How to use</h2>
          <ol className="space-y-4">
            {[
              "Log in to both GradePoints and intranet.tam.ch in the same browser.",
              "Navigate to your Notenbuch page on intranet.tam.ch.",
              "Click the GradePoints extension icon in your toolbar.",
              'Click "Capture grades from this page".',
              "Choose which GradePoints semester this corresponds to.",
              'Review the subjects and click "Import all subjects" (or import one by one).',
            ].map((text, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-blue-900/50 border border-blue-800 flex items-center justify-center text-xs font-bold text-blue-300">
                  {i + 1}
                </span>
                <p className="text-sm text-neutral-300 pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm font-medium transition"
          >
            Go to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
