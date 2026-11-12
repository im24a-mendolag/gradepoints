import type { ReactNode } from "react";
import Link from "next/link";

/** Card layout shared by the login and register pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: { text: string; href: string; link: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-card border border-line p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="text-fg-muted mt-2 text-sm">{subtitle}</p>
          </div>

          {children}

          <p className="text-center text-sm text-fg-muted mt-6">
            {footer.text}{" "}
            <Link href={footer.href} className="text-fg hover:opacity-70 font-medium">
              {footer.link}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const NOTICE_STYLES = {
  info: "bg-sunken border-line text-fg-muted",
  success: "bg-subject-green/10 border-subject-green/40 text-subject-green",
  error: "bg-now-tint border-now/40 text-now",
} as const;

export function Notice({ tone, children }: { tone: keyof typeof NOTICE_STYLES; children: ReactNode }) {
  if (!children) return null;
  return (
    <div className={`mb-4 p-3 rounded-control border text-sm ${NOTICE_STYLES[tone]}`}>{children}</div>
  );
}

export function Field({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  minLength,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-fg-muted mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
        placeholder={placeholder}
        minLength={minLength}
        required
      />
    </div>
  );
}

export function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full py-3 px-4 bg-ink text-on-ink font-medium rounded-control transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

/**
 * Wraps an async submit handler with the shared preventDefault / loading /
 * generic-error handling. `run` returns an error message, or nothing on success.
 */
export function submitHandler(
  setError: (msg: string) => void,
  setLoading: (loading: boolean) => void,
  run: () => Promise<string | void>,
) {
  return async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await run();
      if (err) setError(err);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
}
