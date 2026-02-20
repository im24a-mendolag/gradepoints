"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

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
    <div className="min-h-screen bg-neutral-950">
      <header className="bg-neutral-900 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-neutral-100 hover:opacity-80 transition shrink-0"
            >
              Grade<span className="text-blue-500">Points</span>
            </Link>
            <span className="text-sm text-neutral-500 hidden sm:inline">/ Account</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
            <Link
              href="/dashboard"
              className="text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              &larr; Back
            </Link>
            <span className="text-sm text-neutral-400 hidden sm:inline">
              {session?.user?.name}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-10 space-y-6">
        {/* Change Username */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-100 mb-4">Change Username</h2>
          {nameMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                nameMsg.type === "success"
                  ? "bg-green-900/30 border border-green-800 text-green-300"
                  : "bg-red-900/30 border border-red-800 text-red-300"
              }`}
            >
              {nameMsg.text}
            </div>
          )}
          <form onSubmit={handleNameUpdate} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-100 placeholder-neutral-500"
                placeholder="Your name"
                required
              />
            </div>
            <button
              type="submit"
              disabled={nameLoading || name.trim() === session?.user?.name}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {nameLoading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-neutral-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-100 mb-4">Change Password</h2>
          {pwMsg && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                pwMsg.type === "success"
                  ? "bg-green-900/30 border border-green-800 text-green-300"
                  : "bg-red-900/30 border border-red-800 text-red-300"
              }`}
            >
              {pwMsg.text}
            </div>
          )}
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-neutral-300 mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-100 placeholder-neutral-500"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-100 placeholder-neutral-500"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-neutral-100 placeholder-neutral-500"
                placeholder="Repeat new password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Delete Account */}
        <div className="bg-neutral-900 rounded-xl shadow-sm border border-red-900/50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h2>
          <p className="text-sm text-neutral-400 mb-4">
            This action is permanent and cannot be undone. All your grades, adjustments, and account data will be deleted.
          </p>
          {deleteMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
              {deleteMsg.text}
            </div>
          )}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-5 py-2.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg border border-red-800 transition cursor-pointer"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="deletePassword" className="block text-sm font-medium text-neutral-300 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-neutral-100 placeholder-neutral-500"
                  placeholder="Your password"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading || !deletePassword}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deleteLoading ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => {
                    setConfirmDelete(false);
                    setDeletePassword("");
                    setDeleteMsg(null);
                  }}
                  className="px-5 py-2.5 text-neutral-400 hover:text-neutral-200 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return <AccountContent />;
}
