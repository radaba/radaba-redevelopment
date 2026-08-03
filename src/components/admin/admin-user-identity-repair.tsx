"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, X } from "lucide-react";
import { readAdminApiResponse } from "@/features/admin/admin-api-response";
const PHRASE = "REPAIR USER IDENTITY";
type Preview = {
  userKey: string;
  profile: { displayName: string | null; email: string };
  firebaseAuth: { uid: string; email: string };
  storedIdentity: { uid: string | null; email: string };
  checks: {
    targetUidMatchCount: number;
    emailMatchCount: number;
    existingUidAuthAccountExists: boolean;
    emailConsistent: boolean;
  };
  proposedChange: { field: "uid"; before: string | null; after: string };
  unchangedFields: string[];
  canRepair: boolean;
  blockers: string[];
  warnings: string[];
  baseline: string;
};
const shown = (value: string | null) => value || "Not available";
export function AdminUserIdentityRepair({ userKey }: { userKey: string }) {
  const router = useRouter(),
    [open, setOpen] = useState(false),
    [preview, setPreview] = useState<Preview | null>(null),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  async function load() {
    setOpen(true);
    setBusy(true);
    setPreview(null);
    setMessage(null);
    try {
      const response = await fetch(
          `/api/admin/users/${encodeURIComponent(userKey)}/identity-repair/preview`,
          { method: "POST" },
        ),
        body = await readAdminApiResponse<{ data?: Preview }>(response, "Identity preview failed");
      if (!body.data) throw new Error("Identity preview failed.");
      setPreview(body.data);
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Identity preview failed.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userKey)}/identity-repair/commit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseline: preview.baseline, reason, confirmation }),
        },
      );
      await readAdminApiResponse(response, "Identity repair failed");
      setPreview(null);
      setReason("");
      setConfirmation("");
      setMessage({
        text: "Firebase identity repaired successfully. Ask the affected user to refresh or sign in again.",
        error: false,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Identity repair failed.",
        error: true,
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={load}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-900"
      >
        <Fingerprint className="size-4" />
        Repair Firebase Identity
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="repair-title"
            className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between gap-4">
              <div>
                <h2 id="repair-title" className="text-lg font-semibold">
                  Repair Firebase Identity
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Review the server-verified account and exact RTDB mutation.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>
            {message ? (
              <p
                role={message.error ? "alert" : "status"}
                className={`mt-4 rounded-lg p-3 text-sm ${message.error ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}
              >
                {message.text}
              </p>
            ) : null}
            {busy && !preview ? (
              <p className="mt-5 text-sm">Running identity and duplicate checks…</p>
            ) : null}
            {preview ? (
              <div className="mt-5 space-y-5">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <Field label="User name" value={preview.profile.displayName} />
                  <Field label="RTDB user key" value={preview.userKey} mono />
                  <Field label="Profile email" value={preview.profile.email} />
                  <Field label="Firebase Auth email" value={preview.firebaseAuth.email} />
                  <Field label="Current stored UID" value={preview.storedIdentity.uid} mono />
                  <Field label="Correct Firebase Auth UID" value={preview.firebaseAuth.uid} mono />
                </dl>
                <section className="rounded-xl bg-slate-50 p-4 text-sm">
                  <h3 className="font-semibold">Duplicate checks</h3>
                  <p className="mt-2">
                    Target UID matches: {preview.checks.targetUidMatchCount} · Email matches:{" "}
                    {preview.checks.emailMatchCount}
                  </p>
                  <p>
                    Old UID owns an Auth account:{" "}
                    {preview.checks.existingUidAuthAccountExists ? "Yes — blocked" : "No"} · Emails
                    match: {preview.checks.emailConsistent ? "Yes" : "No"}
                  </p>
                </section>
                <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
                  <strong>Only mutation:</strong> <code>user/{preview.userKey}/uid</code>
                  <p className="mt-2 break-all font-mono text-xs">
                    {shown(preview.proposedChange.before)} → {preview.proposedChange.after}
                  </p>
                  <p className="mt-3">
                    <strong>Unchanged:</strong> {preview.unchangedFields.join(", ")}.
                  </p>
                </section>
                {preview.blockers.length ? (
                  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    Repair blocked: {preview.blockers.join(", ")}
                  </p>
                ) : null}
                {preview.warnings.map((value) => (
                  <p key={value} className="rounded-lg bg-amber-50 p-3 text-sm">
                    {value}
                  </p>
                ))}
                <label className="block text-sm font-medium">
                  Administrator reason
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    className="mt-2 w-full rounded-lg border p-3"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Type <span className="font-mono">{PHRASE}</span>
                  <input
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    className="mt-2 min-h-11 w-full rounded-lg border px-3 font-mono"
                  />
                </label>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setOpen(false)}
                    className="min-h-10 rounded-lg border px-4 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={commit}
                    disabled={
                      busy ||
                      !preview.canRepair ||
                      reason.trim().length < 5 ||
                      confirmation !== PHRASE
                    }
                    className="min-h-10 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50"
                  >
                    {busy ? "Repairing…" : "Commit UID repair"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className={`mt-1 break-all text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {shown(value)}
      </dd>
    </div>
  );
}
