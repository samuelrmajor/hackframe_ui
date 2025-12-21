import { useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export interface AccountSettingsViewProps {
  onBack: () => void;
  session: Session;
  supabase: SupabaseClient;
}

export default function AccountSettingsView({
  onBack,
  session,
  supabase,
}: AccountSettingsViewProps) {
  const email = session.user.email ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPassword) {
      setError("Password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setError(error.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex-1 min-h-0">
      <div className="rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Account Settings</h2>
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1 hover:bg-white/10"
            onClick={onBack}
          >
            Back
          </button>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2">Email</h3>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-400">
              <span className="truncate opacity-70">{email || "(no email)"}</span>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Update Password</h3>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300" htmlFor="newPassword">
                  New password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 hover:bg-white/10 disabled:opacity-50"
              >
                {saving ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
