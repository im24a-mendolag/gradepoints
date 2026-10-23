"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { DashboardProvider } from "../DashboardContext";
import Btn from "../components/Btn";
import ThemeToggle from "../components/ThemeToggle";
import Sidebar from "../components/Sidebar";
import BottomTabBar from "../components/BottomTabBar";

function AccountContent() {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState(session?.user?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleNameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameMsg(null);
    if (!name.trim()) {
      setNameMsg({ type: "error", text: "Name cannot be empty" });
      return;
    }
    setNameLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setNameMsg({ type: "success", text: "Name updated successfully" });
        await updateSession({ name: name.trim() });
      } else {
        setNameMsg({ type: "error", text: data.error || "Failed to update name" });
      }
    } catch {
      setNameMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      setPwMsg({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPwMsg({ type: "error", text: data.error || "Failed to update password" });
      }
    } catch {
      setPwMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteMsg(null);
    if (!deletePassword) {
      setDeleteMsg({ type: "error", text: "Please enter your password" });
      return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      } else {
        setDeleteMsg({ type: "error", text: data.error || "Failed to delete account" });
      }
    } catch {
      setDeleteMsg({ type: "error", text: "Something went wrong" });
    } finally {
      setDeleteLoading(false);
    }
  };

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
        {/* Appearance */}
        <div className="bg-surface rounded-card border border-line p-5 sm:p-6">
          <h2 className="text-base font-medium text-fg mb-4">Appearance</h2>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-fg-muted">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Change Username */}
        <div className="bg-surface rounded-card border border-line p-5 sm:p-6">
          <h2 className="text-base font-medium text-fg mb-4">Change Username</h2>
          {nameMsg && (
            <div
              className={`mb-4 p-3 rounded-control text-sm ${
                nameMsg.type === "success"
                  ? "bg-subject-green/10 border border-subject-green/40 text-subject-green"
                  : "bg-now-tint border border-now/40 text-now"
              }`}
            >
              {nameMsg.text}
            </div>
          )}
          <form onSubmit={handleNameUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-fg-muted mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="Your name"
                required
              />
            </div>
            <Btn type="submit" variant="primary" disabled={nameLoading || name.trim() === session?.user?.name}>
              {nameLoading ? "Saving..." : "Save"}
            </Btn>
          </form>
        </div>

        </div>
        <div className="space-y-6">
        {/* Change Password */}
        <div className="bg-surface rounded-card border border-line p-5 sm:p-6">
          <h2 className="text-base font-medium text-fg mb-4">Change Password</h2>
          {pwMsg && (
            <div
              className={`mb-4 p-3 rounded-control text-sm ${
                pwMsg.type === "success"
                  ? "bg-subject-green/10 border border-subject-green/40 text-subject-green"
                  : "bg-now-tint border border-now/40 text-now"
              }`}
            >
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-fg-muted mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-fg-muted mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-fg-muted mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-control border border-line bg-sunken focus:ring-2 focus:ring-line-strong focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                placeholder="Repeat new password"
                required
              />
            </div>
            <Btn type="submit" variant="primary" disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}>
              {pwLoading ? "Updating..." : "Update Password"}
            </Btn>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-surface rounded-card border border-now/40 p-5 sm:p-6">
          <h2 className="text-base font-medium text-now mb-2">Delete Account</h2>
          <p className="text-sm text-fg-muted mb-4">
            This action is permanent and cannot be undone. All your grades, adjustments, and account data will be deleted.
          </p>
          {deleteMsg && (
            <div className="mb-4 p-3 rounded-control bg-now-tint border border-now/40 text-now text-sm">
              {deleteMsg.text}
            </div>
          )}
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
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-control border border-now/40 bg-sunken focus:ring-2 focus:ring-now focus:border-transparent outline-none transition text-fg placeholder-fg-faint"
                  placeholder="Your password"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <Btn variant="dangerFilled" disabled={deleteLoading || !deletePassword} onClick={handleDeleteAccount}>
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </Btn>
                <Btn onClick={() => { setConfirmDelete(false); setDeletePassword(""); setDeleteMsg(null); }}>Cancel</Btn>
              </div>
            </div>
          )}
        </div>
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
