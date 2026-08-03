'use client';

import { useMemo, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoginError } from "@/components/authentication/login-error";
import { loginWithEmailAndPassword } from "@/services/authentication/client-authentication";
import { ResetPasswordDialog } from "@/components/authentication/reset-password-dialog";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const isValid = useMemo(() => {
    const email = values.email.trim();
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return Boolean(email && isEmailValid && values.password);
  }, [values.email, values.password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await loginWithEmailAndPassword(values.email, values.password);

    if (response.success) {
      const redirectTo = response.data?.redirectTo ?? "/home/assignment";
      const allowedRedirects = ["/home/assignment"];
      const safeRedirectTo = allowedRedirects.includes(redirectTo) ? redirectTo : "/home/assignment";
      router.replace(safeRedirectTo);
      router.refresh();
      return;
    }

    setError(response.error ?? "Unable to sign in.");
    setIsSubmitting(false);
  }

  return (
    <>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            placeholder="name@company.com"
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 transition hover:text-slate-700"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <LoginError message={error} />

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!isValid || isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            onClick={() => setIsResetOpen(true)}
          >
            Forgot password?
          </button>
        </div>
      </form>

      <ResetPasswordDialog
        isOpen={isResetOpen}
        initialEmail={values.email}
        onClose={() => setIsResetOpen(false)}
      />
    </>
  );
}
