"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { DashboardProvider } from "../DashboardContext";
import Btn from "../components/Btn";
import ThemeToggle from "../components/ThemeToggle";
import Sidebar from "../components/Sidebar";
import BottomTabBar from "../components/BottomTabBar";
import { Field, Notice } from "@/components/AuthForm";

type Msg = { tone: "success" | "error"; text: string } | null;

/** Loading + message state around a call to /api/account. */
function useAccountRequest() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  const run = async (method: "PUT" | "DELETE", body: object, fallback: string, onOk: () => unknown) => {
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) await onOk();
      else setMsg({ tone: "error", text: data.error || fallback });
    } catch {
      setMsg({ tone: "error", text: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return { loading, msg, setMsg, run };
}

function Section({ title, children, danger }: { title: string; children: ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-surface rounded-card border p-5 sm:p-6 ${danger ? "border-now/40" : "border-line"}`}>
      <h2 className={`text-base font-medium ${danger ? "text-now mb-2" : "text-fg mb-4"}`}>{title}</h2>
      {children}
    </div>
  );
}

function MsgNotice({ msg }: { msg: Msg }) {
  return msg ? <Notice tone={msg.tone}>{msg.text}</Notice> : null;
}

function NameSection() {
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const { loading, msg, setMsg, run } = useAccountRequest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setMsg({ tone: "error", text: "Name cannot be empty" });
    setMsg(null);
    await run("PUT", { name: trimmed }, "Failed to update name", async () => {
      setMsg({ tone: "success", text: "Name updated successfully" });
      await updateSession({ name: trimmed });
    });
  };

  return (
    <Section title="Change Username">
      <MsgNotice msg={msg} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="name" label="Name" type="text" value={name} onChange={setName} placeholder="Your name" />
        <Btn type="submit" variant="primary" disabled={loading || name.trim() === session?.user?.name}>
          {loading ? "Saving..." : "Save"}
        </Btn>
      </form>
    </Section>
  );
}

const EMPTY_PASSWORDS = { current: "", next: "", confirm: "" };

function passwordError(next: string, confirm: string) {
  if (next !== confirm) return "New passwords do not match";
  if (next.length < 6) return "New password must be at least 6 characters";
  return null;
}

function PasswordSection() {
  const [pw, setPw] = useState(EMPTY_PASSWORDS);
  const { loading, msg, setMsg, run } = useAccountRequest();
  const set = (key: keyof typeof pw) => (value: string) => setPw((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = passwordError(pw.next, pw.confirm);
    if (error) return setMsg({ tone: "error", text: error });
    setMsg(null);
    await run("PUT", { currentPassword: pw.current, newPassword: pw.next }, "Failed to update password", () => {
      setMsg({ tone: "success", text: "Password updated successfully" });
      setPw(EMPTY_PASSWORDS);
    });
  };

  const incomplete = !pw.current || !pw.next || !pw.confirm;

  return (
    <Section title="Change Password">
      <MsgNotice msg={msg} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="currentPassword" label="Current Password" type="password" value={pw.current} onChange={set("current")} placeholder="Enter current password" />
        <Field id="newPassword" label="New Password" type="password" value={pw.next} onChange={set("next")} placeholder="At least 6 characters" />
        <Field id="confirmPassword" label="Confirm New Password" type="password" value={pw.confirm} onChange={set("confirm")} placeholder="Repeat new password" />
        <Btn type="submit" variant="primary" disabled={loading || incomplete}>
          {loading ? "Updating..." : "Update Password"}
        </Btn>
      </form>
    </Section>
  );
}

function DeleteSection() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");
  const { loading, msg, setMsg, run } = useAccountRequest();

  const handleDelete = async () => {
    if (!password) return setMsg({ tone: "error", text: "Please enter your password" });
    setMsg(null);
    await run("DELETE", { password }, "Failed to delete account", () => signOut({ callbackUrl: "/" }));
  };

  const cancel = () => {
    setConfirmDelete(false);
    setPassword("");
    setMsg(null);
  };

  return (
    <Section title="Delete Account" danger>
      <p className="text-sm text-fg-muted mb-4">
        This action is permanent and cannot be undone. All your grades, adjustments, and account data will be deleted.
      </p>
      {msg && <Notice tone="error">{msg.text}</Notice>}
      {!confirmDelete ? (
        <Btn variant="danger" onClick={() => setConfirmDelete(true)}>Delete Account</Btn>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="deletePassword" className="block text-sm font-medium text-fg-muted mb-1">
              Enter your password to confirm
            </label>
            <input
              id="deletePassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-control border border-now/40 bg-sunken focus:ring-2 focus:ring-now focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
              placeholder="Your password"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <Btn variant="dangerFilled" disabled={loading || !password} onClick={handleDelete}>
              {loading ? "Deleting..." : "Confirm Delete"}
            </Btn>
            <Btn onClick={cancel}>Cancel</Btn>
          </div>
        </div>
      )}
    </Section>
  );
}

function AccountContent() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto">
          <header className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Account</h1>
            <p className="text-[11px] text-fg-muted mt-0.5">{session?.user?.name}</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Section title="Appearance">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-fg-muted">Theme</span>
                  <ThemeToggle />
                </div>
              </Section>
              <NameSection />
            </div>
            <div className="space-y-6">
              <PasswordSection />
              <DeleteSection />
            </div>
          </div>
        </div>
      </main>

      <BottomTabBar />
    </div>
  );
}

export default function AccountPage() {
  return (
    <DashboardProvider>
      <AccountContent />
    </DashboardProvider>
  );
}
