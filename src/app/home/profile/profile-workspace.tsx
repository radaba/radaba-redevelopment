"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { z } from "zod";
import { Building2, KeyRound, Mail, Phone, Save, UserRound, X } from "lucide-react";
import type { ApplicationShellUser } from "@/components/application-shell/application-shell";
import { PageHeader } from "@/components/application-shell/page-header";
import { changeCurrentUserPassword } from "@/services/authentication/client-authentication";
import {
  PROFILE_PHOTO_MAX_BYTES,
  PROFILE_PHOTO_TYPES,
} from "@/features/profile/profile-photo-contract";

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required.")
    .max(120, "Full name must be 120 characters or fewer."),
  phone: z
    .string()
    .trim()
    .refine((value) => !value || /^[0-9+()\- .]{6,30}$/.test(value), "Enter a valid phone number."),
});
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(1, "New password is required.").min(6, "New password is too weak."),
    confirmPassword: z.string().min(1, "Password confirmation is required."),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword)
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Password confirmation does not match.",
      });
    if (value.currentPassword && value.currentPassword === value.newPassword)
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "New password must differ from your current password.",
      });
  });
type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
const input =
  "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100";
const display = (value?: string) => value?.trim() || "Not available";
const initials = (name: string, email: string) =>
  (name.trim() || email.split("@")[0] || "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function ProfileWorkspace({ user }: { user: ApplicationShellUser }) {
  const router = useRouter();
  const initial = useMemo(
    () => ({ name: user.name.trim(), phone: user.phone?.trim() ?? "" }),
    [user.name, user.phone],
  );
  const [profile, setProfile] = useState(initial),
    [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null),
    [passwordOpen, setPasswordOpen] = useState(false),
    [photoUrl, setPhotoUrl] = useState(
      user.photoUrl ? `${user.photoUrl}?v=${encodeURIComponent(user.photoUpdatedAt ?? "")}` : "",
    ),
    [photoFile, setPhotoFile] = useState<File | null>(null),
    [photoPreview, setPhotoPreview] = useState(""),
    [photoBusy, setPhotoBusy] = useState(false),
    [photoError, setPhotoError] = useState("");
  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    },
    [photoPreview],
  );
  const selectPhoto = (file?: File) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoError("");
    if (!file) return;
    const ext = file.name.toLowerCase().split(".").pop() ?? "",
      allowed = PROFILE_PHOTO_TYPES[file.type];
    if (!allowed?.includes(ext)) {
      setPhotoError("Choose a JPG, JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > PROFILE_PHOTO_MAX_BYTES) {
      setPhotoError("Profile photos must be 5 MB or smaller.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const uploadPhoto = async () => {
    if (!photoFile || photoBusy) return;
    setPhotoBusy(true);
    setPhotoError("");
    const form = new FormData();
    form.set("file", photoFile);
    const response = await fetch("/api/profile/photo", { method: "POST", body: form });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPhotoError(payload.error ?? "Unable to upload profile photo.");
      setPhotoBusy(false);
      return;
    }
    setPhotoUrl(payload.data.photoUrl);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoBusy(false);
    setNotice({ kind: "success", text: "Profile photo updated successfully." });
    router.refresh();
  };
  const removePhoto = async () => {
    if (photoBusy || (!photoUrl && !user.photoUrl)) return;
    setPhotoBusy(true);
    setPhotoError("");
    const response = await fetch("/api/profile/photo", { method: "DELETE" }),
      payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setPhotoError(payload.error ?? "Unable to remove profile photo.");
      setPhotoBusy(false);
      return;
    }
    setPhotoUrl("");
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview("");
    setPhotoBusy(false);
    setNotice({
      kind: "success",
      text: payload.data.cleanupWarning ?? "Profile photo removed successfully.",
    });
    router.refresh();
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: initial,
    mode: "onBlur",
  });
  const save = async (values: ProfileForm) => {
    setNotice(null);
    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, expected: profile }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (payload.code === "profile_changed") {
        const latest = await fetch("/api/profile", { cache: "no-store" })
          .then((result) => result.json())
          .catch(() => null);
        if (latest?.data?.profile) {
          const next = {
            name: latest.data.profile.name ?? "",
            phone: latest.data.profile.phone ?? "",
          };
          setProfile(next);
          reset(next);
        }
      }
      setNotice({ kind: "error", text: payload.error ?? "Unable to update profile." });
      return;
    }
    const next = { name: payload.data.profile.name, phone: payload.data.profile.phone };
    setProfile(next);
    reset(next);
    setNotice({ kind: "success", text: "Profile updated successfully." });
  };
  return (
    <div className="space-y-5">
      <PageHeader
        title="Profile"
        description="Manage your personal information and account security."
      />
      <div aria-live="polite">
        {notice ? (
          <div
            role={notice.kind === "error" ? "alert" : "status"}
            className={`rounded-xl border p-3 text-sm ${notice.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}
          >
            {notice.text}
          </div>
        ) : null}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(15rem,0.34fr)_minmax(0,0.66fr)]">
        <aside
          className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm"
          aria-label="Account summary"
        >
          <div
            className="relative mx-auto grid size-24 place-items-center overflow-hidden rounded-full bg-indigo-50 text-2xl font-semibold text-indigo-700"
            aria-label={`Profile photo for ${display(profile.name)}`}
          >
            {photoPreview || photoUrl ? (
              <Image
                src={photoPreview || photoUrl}
                alt={`Profile photo for ${display(profile.name)}`}
                fill
                sizes="96px"
                unoptimized
                className="object-cover"
              />
            ) : (
              initials(profile.name, user.email)
            )}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">{display(profile.name)}</h2>
          <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge>{display(user.role)}</Badge>
            <Badge>{display(user.status)}</Badge>
          </div>
          <dl className="mt-5 space-y-3 border-t pt-5 text-left">
            <Item icon={Building2} label="Company" value={display(user.company)} />
            <Item icon={Mail} label="Email" value={user.email} />
            <Item icon={Phone} label="Phone" value={display(profile.phone)} />
          </dl>
          <div className="mt-5 border-t pt-5 text-left">
            <label htmlFor="profile-photo" className="block text-sm font-semibold text-slate-900">
              Profile picture
            </label>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              JPG, JPEG, PNG, or WebP. Maximum 5 MB.
            </p>
            <input
              id="profile-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={photoBusy}
              onChange={(event) => selectPhoto(event.target.files?.[0])}
              className="mt-3 block w-full text-xs file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:font-semibold file:text-indigo-700"
            />
            {photoError ? (
              <p role="alert" className="mt-2 text-xs text-rose-700">
                {photoError}
              </p>
            ) : null}
            {photoPreview ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => void uploadPhoto()}
                  className="min-h-10 flex-1 rounded-lg bg-indigo-700 px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {photoBusy ? "Uploading…" : "Upload photo"}
                </button>
                <button
                  type="button"
                  disabled={photoBusy}
                  onClick={() => selectPhoto()}
                  className="min-h-10 rounded-lg border px-3 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            ) : null}
            {!photoPreview && (photoUrl || user.photoUrl) ? (
              <button
                type="button"
                disabled={photoBusy}
                onClick={() => void removePhoto()}
                className="mt-3 min-h-10 w-full rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 disabled:opacity-50"
              >
                {photoBusy ? "Removing…" : "Remove Photo"}
              </button>
            ) : null}
          </div>
        </aside>
        <main className="space-y-5">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="personal-information"
          >
            <h2 id="personal-information" className="font-semibold text-slate-950">
              Personal information
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Update the profile fields approved for self-service.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit(save)} noValidate>
              <Field label="Full name" error={errors.name?.message}>
                <input
                  {...register("name")}
                  autoComplete="name"
                  className={input}
                  aria-invalid={Boolean(errors.name)}
                />
              </Field>
              <Field label="Phone number" error={errors.phone?.message}>
                <input
                  {...register("phone")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  className={input}
                  aria-invalid={Boolean(errors.phone)}
                  placeholder="Optional"
                />
              </Field>
              <Field
                label="Email address"
                help="Email is your Firebase login identity and cannot be changed here."
              >
                <input value={user.email} readOnly disabled className={input} />
              </Field>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isDirty || isSubmitting}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save className="size-4" />
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </section>
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="account-security"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="account-security" className="font-semibold text-slate-950">
                  Security
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Reauthenticate securely before changing your Firebase password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordOpen(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-semibold text-indigo-700 focus-visible:ring-2"
              >
                <KeyRound className="size-4" />
                Change password
              </button>
            </div>
          </section>
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            aria-labelledby="account-metadata"
          >
            <h2 id="account-metadata" className="font-semibold text-slate-950">
              Account metadata
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Meta label="Role" value={display(user.role)} />
              <Meta label="Account status" value={display(user.status)} />
              <Meta label="Department" value={display(user.department)} />
              <Meta label="Region" value={display(user.region)} />
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              Role, privileges, account status, UID, and organization fields are
              administrator-controlled.
            </p>
          </section>
        </main>
      </div>
      <PasswordDialog open={passwordOpen} email={user.email} close={() => setPasswordOpen(false)} />
    </div>
  );
}

function PasswordDialog({
  open,
  email,
  close,
}: {
  open: boolean;
  email: string;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  useEffect(() => {
    const node = dialog.current;
    if (open && !node?.open) node?.showModal();
    if (!open && node?.open) node.close();
  }, [open, reset]);
  const dismiss = () => {
    if (isSubmitting) return;
    reset();
    setNotice(null);
    dialog.current?.close();
    close();
  };
  const submit = async (values: PasswordForm) => {
    setNotice(null);
    const result = await changeCurrentUserPassword(
      email,
      values.currentPassword,
      values.newPassword,
    );
    reset();
    setNotice(
      result.success
        ? {
            kind: "success",
            text: result.warning ?? "Password changed successfully.",
          }
        : { kind: "error", text: result.error ?? "Unable to change password." },
    );
  };
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={() => {
        if (open) close();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/60"
    >
      <section aria-labelledby="change-password-title" className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="change-password-title" className="font-semibold text-slate-950">
              Change password
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Enter your current password to verify your identity.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            disabled={isSubmitting}
            aria-label="Close change password dialog"
            className="rounded-lg p-2 focus-visible:ring-2"
          >
            <X className="size-5" />
          </button>
        </div>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit(submit)} noValidate>
          <PasswordField
            label="Current password"
            name="current-password"
            autoComplete="current-password"
            registration={register("currentPassword")}
            error={errors.currentPassword?.message}
          />
          <PasswordField
            label="New password"
            name="new-password"
            autoComplete="new-password"
            registration={register("newPassword")}
            error={errors.newPassword?.message}
          />
          <PasswordField
            label="Confirm new password"
            name="confirm-password"
            autoComplete="new-password"
            registration={register("confirmPassword")}
            error={errors.confirmPassword?.message}
          />
          {notice ? (
            <p
              role={notice.kind === "error" ? "alert" : "status"}
              aria-live="polite"
              className={`rounded-xl p-3 text-sm ${notice.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}
            >
              {notice.text}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={dismiss}
              disabled={isSubmitting}
              className="min-h-11 rounded-xl border px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSubmitting ? "Changing…" : "Change password"}
            </button>
          </div>
        </form>
      </section>
    </dialog>
  );
}
function PasswordField({
  label,
  name,
  autoComplete,
  registration,
  error,
}: {
  label: string;
  name: string;
  autoComplete: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShown((value) => !value)}
          aria-label={`${shown ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="text-xs font-semibold text-indigo-700"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
      <input
        id={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        {...registration}
        className={input}
        aria-invalid={Boolean(error)}
      />
      {error ? (
        <p role="alert" className="mt-1 text-xs text-rose-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
function Field({
  label,
  error,
  help,
  children,
}: {
  label: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      {children}
      {help ? <span className="mt-1 block text-xs font-normal text-slate-500">{help}</span> : null}
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-normal text-rose-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
      {children}
    </span>
  );
}
function Item({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-all text-sm font-semibold text-slate-800">{value}</dd>
      </div>
    </div>
  );
}
function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
