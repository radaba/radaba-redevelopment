'use client';

import { useMemo, useState } from "react";
import { resetPassword } from "@/services/authentication/client-authentication";
import { PASSWORD_RESET_HELP_MESSAGE, PASSWORD_RESET_PUBLIC_MESSAGE } from "@/features/authentication/password-reset.mjs";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  initialEmail: string;
  onClose: () => void;
}

export function ResetPasswordDialog({ isOpen, initialEmail, onClose }: ResetPasswordDialogProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0, [email]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    await resetPassword(email);
    setSuccess(true);
    setIsSubmitting(false);
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reset password</h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter the email address linked to your account and we will send reset instructions.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Close reset password dialog"
          >
            ×
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="reset-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              id="reset-email"
              name="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="name@company.com"
              disabled={isSubmitting}
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {PASSWORD_RESET_PUBLIC_MESSAGE}
              <span className="mt-1 block">{PASSWORD_RESET_HELP_MESSAGE}</span>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting || !canSubmit}
            >
              {isSubmitting ? "Sending..." : "Send reset link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
