import ExtensionShell from "./ExtensionShell";
import { IconFirefox, IconChrome } from "../dashboard/components/Icons";

export const metadata = { title: "GradePoints – Install Extension" };

export default function ExtensionPage() {
  return (
    <ExtensionShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-fg mb-1">Extension Importer</h1>
          <p className="text-fg-muted text-sm">
            A browser extension that imports your grades directly from{" "}
            <span className="text-fg">intranet.tam.ch</span> into GradePoints — no copy-pasting needed.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left column: install */}
        <div>
        {/* Firefox — primary CTA */}
        <div className="mb-12 p-6 rounded-card border border-subject-orange/40 bg-subject-orange/10">
          <div className="flex items-center gap-2.5 mb-1">
            <IconFirefox size={22} className="text-[#ff7139]" />
            <h2 className="text-base font-medium">Firefox</h2>
            <span className="ml-1 text-[11px] font-medium bg-subject-orange/15 text-subject-orange border border-subject-orange/40 px-2 py-0.5 rounded-full">
              One-click install
            </span>
          </div>
          <p className="text-sm text-fg-muted mb-5">Click the button — Firefox will show an install prompt.</p>
          <a
            href="/gradepoints-extension.xpi"
            className="inline-flex items-center gap-2 px-6 py-3 bg-subject-orange text-on-solid font-medium rounded-control transition hover:opacity-90 text-base"
          >
            Install for Firefox
          </a>
        </div>

        {/* Chrome */}
        <div className="mb-3">
          <div className="flex items-center gap-2.5 mb-1">
            <IconChrome size={22} className="text-[#4285f4]" />
            <h2 className="text-base font-medium">Chrome</h2>
          </div>
          <p className="text-sm text-fg-muted mb-5">Chrome requires loading the extension manually in developer mode.</p>
        </div>

        {/* Chrome step 1 — download */}
        <div className="mb-8 p-5 rounded-card border border-line bg-surface">
          <p className="text-[11px] font-semibold text-fg-faint uppercase tracking-wide mb-3">Step 1 — Download</p>
          <a
            href="/gradepoints-extension.zip"
            download
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90 text-base"
          >
            Download gradepoints-extension.zip
          </a>
        </div>

        {/* Chrome steps 2-5 */}
        <div className="p-5 rounded-card border border-line bg-surface mb-4">
          <p className="text-[11px] font-semibold text-fg-faint uppercase tracking-wide mb-4">Step 2 — Load in Chrome</p>
          <ol className="space-y-4">
            {[
              <>Unzip the file anywhere on your computer.</>,
              <>Go to <code className="bg-sunken px-1.5 py-0.5 rounded text-fg font-mono text-xs">chrome://extensions</code> in your address bar.</>,
              <>Enable <strong className="text-fg">Developer mode</strong> using the toggle in the top-right corner.</>,
              <>Click <strong className="text-fg">Load unpacked</strong> and select the unzipped folder.</>,
            ].map((text, i) => (
              <li key={i} className="flex gap-4 items-start">
                <span className="shrink-0 w-7 h-7 rounded-full bg-sunken border border-line flex items-center justify-center text-xs font-mono text-fg-muted">
                  {i + 1}
                </span>
                <p className="text-sm text-fg-muted pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-xs text-fg-faint bg-surface border border-line rounded-control px-4 py-3">
          The extension stays installed permanently. If Chrome warns you about Developer mode extensions at startup, click <strong className="text-fg-muted">Keep</strong>.
        </div>
        </div>

        {/* Right column: how to use */}
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-7">
          <h2 className="text-base font-medium mb-4">How to use</h2>
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
                <span className="shrink-0 w-7 h-7 rounded-full bg-hover border border-line flex items-center justify-center text-xs font-mono text-fg-muted">
                  {i + 1}
                </span>
                <p className="text-sm text-fg-muted pt-1">{text}</p>
              </li>
            ))}
          </ol>
        </section>
        </div>
      </div>
    </ExtensionShell>
  );
}
