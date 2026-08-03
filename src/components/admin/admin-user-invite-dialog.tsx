"use client";
import { useState, type FormEvent } from "react";
import { UserPlus } from "lucide-react";
import type { AdminUserRecord } from "@/features/admin/admin-types";
import { administratorRoleLabel } from "@/features/admin/administrator-role-contract";
import { readAdminApiResponse } from "@/features/admin/admin-api-response";
export function AdminUserInviteDialog({
  roles,
  close,
  complete,
}: {
  roles: string[];
  close: () => void;
  complete: (user: AdminUserRecord) => void;
}) {
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        body = await readAdminApiResponse<{
          data?: AdminUserRecord;
          fields?: Record<string, string>;
        }>(response, "Invitation failed");
      if (!body.data) throw new Error(Object.values(body.fields ?? {})[0] || "Invitation failed.");
      complete(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invitation failed.");
      setSaving(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="my-6 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <UserPlus aria-hidden="true" className="size-5 text-indigo-700" />
          <h2 id="invite-title" className="text-lg font-semibold">
            Invite User
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Creates an Active application profile and Firebase Authentication account. The temporary
          password is never displayed.
        </p>
        {error ? (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <form onSubmit={submit} className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Name" required autoFocus />
            <Field name="email" label="Email" type="email" required />
            <label className="text-sm font-medium">
              Initial Role
              <select
                name="role"
                required
                defaultValue=""
                className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 focus-visible:ring-2"
              >
                <option value="" disabled>
                  Select a role
                </option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {administratorRoleLabel(role)} ({role})
                  </option>
                ))}
              </select>
            </label>
            <Field name="company" label="Company" required />
            <Field name="department" label="Department" required />
            <Field name="region" label="Region" required />
            <Field name="phone" label="Phone (optional)" type="tel" />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            The user should select Forgot Password on the existing login page to establish their own
            password.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={close}
              className="min-h-10 rounded-lg border px-4 font-semibold focus-visible:ring-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-10 rounded-lg bg-indigo-700 px-4 font-semibold text-white disabled:opacity-50 focus-visible:ring-2"
            >
              {saving ? "Creating…" : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function Field({
  name,
  label,
  type = "text",
  required = false,
  autoFocus = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        autoFocus={autoFocus}
        maxLength={type === "email" ? 254 : 120}
        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 focus-visible:ring-2"
      />
    </label>
  );
}
