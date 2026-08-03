"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Filter, RefreshCw, Search, ShieldCheck, UserCog, UserPlus, X } from "lucide-react";
import type { AdminUserRecord } from "@/features/admin/admin-types";
import { ADMIN_USER_STATUSES } from "@/features/admin/admin-types";
import {
  ADMIN_USER_PAGE_SIZES,
  type AdminUserListParams,
  type AdminUserListResult,
} from "@/features/admin/admin-user-list";
import { PageHeader } from "@/components/application-shell/page-header";
import { AdminEmptyState } from "./admin-page-state";
import { AdminUserInviteDialog } from "./admin-user-invite-dialog";
import { AdminSessionRevocationButton } from "./admin-session-revocation-button";
import { administratorRoleLabel } from "@/features/admin/administrator-role-contract";
import { readAdminApiResponse } from "@/features/admin/admin-api-response";
import { UserDeletePreviewDialog } from "./user-delete-preview-dialog";

type EditMode = "role" | "status";
interface EditState {
  user: AdminUserRecord;
  mode: EditMode;
  value: string;
}
interface FilterOptions {
  companies: string[];
  regions: string[];
}
const SORT_OPTIONS = [
  ["name", "Name"],
  ["email", "Email"],
  ["role", "Role"],
  ["status", "Status"],
  ["company", "Company / Partner"],
  ["region", "Region"],
] as const;

export function AdminUsersClient({
  initialUsers,
  roles,
  filterRoles,
  filterOptions,
  list,
}: {
  initialUsers: AdminUserRecord[];
  roles: string[];
  filterRoles: string[];
  filterOptions: FilterOptions;
  list: AdminUserListResult;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [deletePreviewUser, setDeletePreviewUser] = useState<AdminUserRecord | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const activeFilterCount = [
    list.params.query,
    list.params.role,
    list.params.status,
    list.params.company,
    list.params.region,
  ].filter(Boolean).length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true);
    setMessage(null);
    const previous = editing.mode === "role" ? editing.user.role : editing.user.status;
    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(editing.user.key)}/${editing.mode}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            editing.mode === "role"
              ? { role: editing.value, previousRole: previous }
              : { status: editing.value, previousStatus: previous, confirmed: true },
          ),
        },
      );
      await readAdminApiResponse<{ success: boolean }>(response, "Update failed");
      setUsers((current) =>
        current.map((user) =>
          user.key === editing.user.key ? { ...user, [editing.mode]: editing.value } : user,
        ),
      );
      setMessage({
        text: `${editing.mode === "role" ? "Role" : "Status"} updated successfully.`,
        error: false,
      });
      setEditing(null);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Update failed.", error: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`${list.totalCount} existing users · email and UID remain read-only`}
        actions={
          <button
            type="button"
            onClick={() => location.reload()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Refresh
          </button>
        }
      />
      {message ? (
        <p
          role={message.error ? "alert" : "status"}
          className={`rounded-lg px-4 py-3 text-sm ${message.error ? "bg-red-50 text-red-800" : "bg-indigo-50 text-indigo-800"}`}
        >
          {message.text}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2"
        >
          <UserPlus aria-hidden="true" className="size-4" />
          Invite User
        </button>
      </div>
      <UserFilters
        params={list.params}
        roles={filterRoles}
        options={filterOptions}
        activeFilterCount={activeFilterCount}
      />
      <div
        aria-live="polite"
        className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
      >
        <p>
          {list.filteredCount === list.totalCount
            ? `${list.totalCount} users`
            : `${list.filteredCount} of ${list.totalCount} users`}
        </p>
        <p>
          {list.filteredCount ? `Showing ${list.rangeStart}–${list.rangeEnd}` : "No matching users"}
        </p>
      </div>
      {!users.length ? (
        <AdminEmptyState
          title={activeFilterCount ? "No matching users" : "No users"}
          description={
            activeFilterCount
              ? "Try adjusting or clearing the current filters."
              : "No existing user records were found."
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="max-h-[68vh] overflow-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr>
                    {[
                      "Name",
                      "Email",
                      "Role",
                      "Status",
                      "Company / Partner",
                      "Region",
                      "Last login",
                      "Actions",
                    ].map((label) => (
                      <th
                        key={label}
                        scope="col"
                        className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map((user) => (
                    <UserRow key={user.key} user={user} edit={setEditing} preview={setDeletePreviewUser} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid gap-4 md:hidden">
            {users.map((user) => (
              <UserCard key={user.key} user={user} edit={setEditing} preview={setDeletePreviewUser} />
            ))}
          </div>
        </>
      )}
      <Pagination
        params={list.params}
        pageCount={list.pageCount}
        filteredCount={list.filteredCount}
      />
      {editing ? (
        <EditDialog
          edit={editing}
          roles={roles}
          saving={saving}
          setEdit={setEditing}
          submit={submit}
        />
      ) : null}
      {deletePreviewUser ? <UserDeletePreviewDialog user={deletePreviewUser} close={() => setDeletePreviewUser(null)} /> : null}
      {inviteOpen ? (
        <AdminUserInviteDialog
          roles={roles}
          close={() => setInviteOpen(false)}
          complete={(user) => {
            setUsers((current) => [user, ...current]);
            setInviteOpen(false);
            setMessage({
              text: "User provisioned. They can use Forgot Password to set their password.",
              error: false,
            });
          }}
        />
      ) : null}
    </div>
  );
}

function UserFilters({
  params,
  roles,
  options,
  activeFilterCount,
}: {
  params: AdminUserListParams;
  roles: string[];
  options: FilterOptions;
  activeFilterCount: number;
}) {
  return (
    <form
      method="get"
      action="/home/admin/users"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Filter aria-hidden="true" className="size-4 text-indigo-700" />
        Search and filters
        {activeFilterCount ? (
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
            {activeFilterCount} active
          </span>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="sm:col-span-2">
          <span className="sr-only">Search users</span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3 size-4 text-slate-400"
            />
            <input
              name="q"
              defaultValue={params.query}
              maxLength={100}
              placeholder="Name, email, UID, role, company, or region"
              className="min-h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
            />
          </span>
        </label>
        <FilterSelect name="role" label="Role" value={params.role} values={roles} />
        <FilterSelect
          name="status"
          label="Status"
          value={params.status}
          values={[...ADMIN_USER_STATUSES]}
        />
        <FilterSelect
          name="company"
          label="Company / Partner"
          value={params.company}
          values={options.companies}
        />
        <FilterSelect name="region" label="Region" value={params.region} values={options.regions} />
        <label className="text-xs font-semibold text-slate-600">
          Sort by
          <select
            name="sort"
            defaultValue={params.sort}
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {SORT_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Direction
          <select
            name="direction"
            defaultValue={params.direction}
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Rows per page
          <select
            name="pageSize"
            defaultValue={String(params.pageSize)}
            className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {ADMIN_USER_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-3">
        {activeFilterCount ? (
          <Link
            href="/home/admin/users"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X aria-hidden="true" className="size-4" />
            Clear filters
          </Link>
        ) : null}
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Apply
        </button>
      </div>
    </form>
  );
}
function FilterSelect({
  name,
  label,
  value,
  values,
}: {
  name: string;
  label: string;
  value: string;
  values: string[];
}) {
  return (
    <label className="text-xs font-semibold text-slate-600">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="mt-1 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <option value="">All {label.toLowerCase()}</option>
        {values.map((option) => (
          <option key={option} value={option}>
            {label === "Role" ? `${administratorRoleLabel(option)} (${option})` : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pagination({
  params,
  pageCount,
  filteredCount,
}: {
  params: AdminUserListParams;
  pageCount: number;
  filteredCount: number;
}) {
  if (!filteredCount || pageCount <= 1) return null;
  return (
    <nav aria-label="Users pagination" className="flex items-center justify-between gap-3">
      <PageLink params={params} page={params.page - 1} disabled={params.page <= 1}>
        Previous
      </PageLink>
      <span className="text-sm text-slate-600">
        Page {params.page} of {pageCount}
      </span>
      <PageLink params={params} page={params.page + 1} disabled={params.page >= pageCount}>
        Next
      </PageLink>
    </nav>
  );
}
function PageLink({
  params,
  page,
  disabled,
  children,
}: {
  params: AdminUserListParams;
  page: number;
  disabled: boolean;
  children: string;
}) {
  const query = new URLSearchParams();
  [
    ["q", params.query],
    ["role", params.role],
    ["status", params.status],
    ["company", params.company],
    ["region", params.region],
  ].forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  query.set("sort", params.sort);
  query.set("direction", params.direction);
  query.set("pageSize", String(params.pageSize));
  query.set("page", String(page));
  const className =
    "inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500";
  return disabled ? (
    <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-50`}>
      {children}
    </span>
  ) : (
    <Link href={`/home/admin/users?${query}`} className={className}>
      {children}
    </Link>
  );
}

function UserRow({ user, edit, preview }: { user: AdminUserRecord; edit: (state: EditState) => void; preview:(user:AdminUserRecord)=>void }) {
  return (
    <tr>
      <td className="px-4 py-3 font-semibold">
        <span className="flex items-center gap-2">
          <UserAvatar user={user} />
          {user.name || "—"}
        </span>
      </td>
      <td className="px-4 py-3">{user.email || "—"}</td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={user.status} />
      </td>
      <td className="px-4 py-3">{user.company || "—"}</td>
      <td className="px-4 py-3">{user.region || "—"}</td>
      <td className="px-4 py-3 text-slate-500">Not available</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/home/admin/users/${encodeURIComponent(user.key)}`}
            className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 focus-visible:ring-2"
          >
            View
          </Link>
          <EditButton user={user} mode="role" edit={edit} />
          <EditButton user={user} mode="status" edit={edit} />
        <Link href={`/home/admin/users/${encodeURIComponent(user.key)}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700">Edit</Link>
        <button type="button" disabled title="Reset Password is not implemented yet" className="min-h-10 text-sm font-semibold text-slate-400">Reset Password</button>
        <button type="button" onClick={() => preview(user)} className="min-h-10 text-sm font-semibold text-red-700 focus-visible:ring-2">Delete Preview</button>
          <Link href={`/home/admin/users/${encodeURIComponent(user.key)}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700">Edit</Link>
          <button type="button" disabled title="Reset Password is not implemented yet" className="min-h-10 text-sm font-semibold text-slate-400">Reset Password</button>
          <button type="button" onClick={() => preview(user)} className="min-h-10 text-sm font-semibold text-red-700 focus-visible:ring-2">Delete Preview</button>
          <AdminSessionRevocationButton
            userKey={user.key}
            label={user.name || user.email || "this user"}
          />
        </div>
      </td>
    </tr>
  );
}
function UserCard({ user, edit, preview }: { user: AdminUserRecord; edit: (state: EditState) => void; preview:(user:AdminUserRecord)=>void }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} large />
        <div>
          <h2 className="font-semibold">{user.name || "Unnamed user"}</h2>
          <p className="mt-1 break-all text-sm text-slate-600">{user.email}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <RoleBadge role={user.role} />
        <StatusBadge status={user.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <Field label="Company / Partner" value={user.company} />
        <Field label="Region" value={user.region} />
        <Field label="Last login" value={null} />
      </dl>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/home/admin/users/${encodeURIComponent(user.key)}`}
          className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 focus-visible:ring-2"
        >
          View details
        </Link>
        <EditButton user={user} mode="role" edit={edit} />
        <EditButton user={user} mode="status" edit={edit} />
        <Link href={`/home/admin/users/${encodeURIComponent(user.key)}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700">Edit</Link>
        <button type="button" disabled title="Reset Password is not implemented yet" className="min-h-10 text-sm font-semibold text-slate-400">Reset Password</button>
        <button type="button" onClick={() => preview(user)} className="min-h-10 text-sm font-semibold text-red-700 focus-visible:ring-2">Delete Preview</button>
        <AdminSessionRevocationButton
          userKey={user.key}
          label={user.name || user.email || "this user"}
        />
      </div>
    </article>
  );
}
function UserAvatar({ user, large = false }: { user: AdminUserRecord; large?: boolean }) {
  const initials = (user.name || user.email || "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((value) => value[0]?.toUpperCase())
    .join("");
  const size = large ? "size-12" : "size-8";
  return (
    <span className={`relative flex ${size} shrink-0 overflow-hidden rounded-xl bg-indigo-100`}>
      {user.photoUrl && user.uid ? (
        <Image
          src={`/api/admin/users/${encodeURIComponent(user.key)}/photo?v=${encodeURIComponent(user.photoUpdatedAt ?? "")}`}
          alt=""
          fill
          sizes={large ? "48px" : "32px"}
          unoptimized
          className="object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-xs font-bold text-indigo-700">
          {initials}
        </span>
      )}
    </span>
  );
}
function EditButton({
  user,
  mode,
  edit,
}: {
  user: AdminUserRecord;
  mode: EditMode;
  edit: (state: EditState) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => edit({ user, mode, value: (mode === "role" ? user.role : user.status) || "" })}
      className="min-h-10 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      {mode === "role" ? "Change Role" : user.status === "Active" ? "Deactivate" : "Activate"}
    </button>
  );
}
function EditDialog({
  edit,
  roles,
  saving,
  setEdit,
  submit,
}: {
  edit: EditState;
  roles: string[];
  saving: boolean;
  setEdit: (state: EditState | null) => void;
  submit: (event: FormEvent) => void;
}) {
  const options = edit.mode === "role" ? roles : [...ADMIN_USER_STATUSES];
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          {edit.mode === "role" ? (
            <UserCog aria-hidden="true" className="size-5 text-indigo-700" />
          ) : (
            <ShieldCheck aria-hidden="true" className="size-5 text-indigo-700" />
          )}
          <h2 id="edit-title" className="text-lg font-semibold">
            Change user {edit.mode}
          </h2>
        </div>
        <p className="mt-2 text-sm text-slate-600">{edit.user.name || edit.user.email}</p>
        <form onSubmit={submit} className="mt-5">
          <label className="text-sm font-medium">
            {edit.mode === "role" ? "Role" : "Status"}
            <select
              autoFocus
              value={edit.value}
              onChange={(event) => setEdit({ ...edit, value: event.target.value })}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {edit.mode === "role" ? `${administratorRoleLabel(option)} (${option})` : option}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-4 text-sm text-amber-700">
            Confirming changes only this field. Final-administrator protections are enforced by the
            server.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => setEdit(null)}
              className="min-h-10 rounded-lg border px-4 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !edit.value}
              className="min-h-10 rounded-lg bg-indigo-700 px-4 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Confirm change"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
function RoleBadge({ role }: { role: string | null }) {
  return (
    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
      {role || "Unknown"}
    </span>
  );
}
function StatusBadge({ status }: { status: string | null }) {
  const active = status === "Active";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
    >
      {status === "Not Active" ? "Inactive" : status || "Unknown"}
    </span>
  );
}
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-1">{value || "Not available"}</dd>
    </div>
  );
}
