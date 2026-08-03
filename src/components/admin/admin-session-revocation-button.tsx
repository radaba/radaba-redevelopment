"use client";
import { useState } from "react";
import { readAdminApiResponse } from "@/features/admin/admin-api-response";
export function AdminSessionRevocationButton({
  userKey,
  label,
}: {
  userKey: string;
  label: string;
}) {
  const [open, setOpen] = useState(false),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  async function revoke() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(userKey)}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, confirmSelf: true }),
      });
      await readAdminApiResponse(response, "Session revocation failed");
      setMessage("All refresh tokens were revoked.");
      setOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Session revocation failed.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      {
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMessage("");
          }}
          className="min-h-10 text-sm font-semibold text-red-700 focus-visible:ring-2"
        >
          Revoke sessions
        </button>
      }
      {message ? (
        <span role="status" className="text-xs text-slate-600">
          {message}
        </span>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revoke-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="revoke-title" className="text-lg font-semibold">
              Revoke all sessions?
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              All refresh tokens for {label} will be revoked. If this is your account, your current
              session may expire.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setOpen(false)}
                className="min-h-10 rounded-lg border px-4 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={revoke}
                className="min-h-10 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Revoking…" : "Confirm revocation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
