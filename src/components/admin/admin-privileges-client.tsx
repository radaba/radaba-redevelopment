"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  History,
  KeyRound,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/application-shell/page-header";
import type { AdminPrivilegeRecord, AdminRoleSummary } from "@/features/admin/admin-types";
import { readAdminApiResponse } from "@/features/admin/admin-api-response";
import { AdminEmptyState } from "./admin-page-state";

interface PendingChange {
  record: AdminPrivilegeRecord;
  role: string;
  enabled: boolean;
}
type Coverage = "all" | "assigned" | "unassigned";
type Protection = "all" | "protected" | "standard";
const ADMIN_PATH = "/privilege";
const fieldClass =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const text = (value: string | null, fallback = "Not available") => value?.trim() || fallback;
const moduleName = (record: AdminPrivilegeRecord) => text(record.category, "Other");
const rolesUsing = (record: AdminPrivilegeRecord) =>
  Object.values(record.roleValues).filter((value) => value === true).length;
const isProtected = (record: AdminPrivilegeRecord) => record.path === ADMIN_PATH;

export function AdminPrivilegesClient({
  initialPrivileges,
  roles,
  selectedRole,
  roleSummaries,
}: {
  initialPrivileges: AdminPrivilegeRecord[];
  roles: string[];
  selectedRole?: string;
  roleSummaries: AdminRoleSummary[];
}) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams(),
    [refreshing, startTransition] = useTransition();
  const [privileges, setPrivileges] = useState(initialPrivileges),
    [pending, setPending] = useState<PendingChange | null>(null),
    [saving, setSaving] = useState(false),
    [message, setMessage] = useState("");
  const effectiveRole =
      selectedRole && roles.includes(selectedRole) ? selectedRole : (roles[0] ?? ""),
    visibleRoles = effectiveRole ? [effectiveRole] : [],
    selectedSummary = roleSummaries.find((summary) => summary.role === effectiveRole);
  const appliedQ = params.get("q")?.trim() ?? "",
    appliedModule = params.get("module")?.trim() ?? "",
    appliedCoverage = (params.get("coverage") ?? "all") as Coverage,
    appliedProtection = (params.get("protection") ?? "all") as Protection;
  const [query, setQuery] = useState(appliedQ),
    [module, setModule] = useState(appliedModule),
    [coverage, setCoverage] = useState<Coverage>(
      ["all", "assigned", "unassigned"].includes(appliedCoverage) ? appliedCoverage : "all",
    ),
    [protection, setProtection] = useState<Protection>(
      ["all", "protected", "standard"].includes(appliedProtection) ? appliedProtection : "all",
    );
  const modules = useMemo(() => [...new Set(privileges.map(moduleName))].sort(), [privileges]);
  const filtered = useMemo(
    () =>
      privileges.filter((record) => {
        const q = appliedQ.toLowerCase(),
          assigned = rolesUsing(record) > 0,
          protectedRecord = isProtected(record);
        return (
          (!q ||
            [
              record.page_name,
              record.path,
              record.privilege_id,
              record.category,
              record.parent,
            ].some((value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(q),
            )) &&
          (!appliedModule || moduleName(record) === appliedModule) &&
          (appliedCoverage === "all" || (appliedCoverage === "assigned" ? assigned : !assigned)) &&
          (appliedProtection === "all" ||
            (appliedProtection === "protected" ? protectedRecord : !protectedRecord))
        );
      }),
    [privileges, appliedQ, appliedModule, appliedCoverage, appliedProtection],
  );
  const groups = useMemo(
    () =>
      modules
        .map((name) => ({
          name,
          records: filtered.filter((record) => moduleName(record) === name),
        }))
        .filter((group) => group.records.length),
    [modules, filtered],
  );
  const apply = () => {
    const next = new URLSearchParams();
    if (effectiveRole) next.set("role", effectiveRole);
    if (query.trim()) next.set("q", query.trim());
    if (module) next.set("module", module);
    if (coverage !== "all") next.set("coverage", coverage);
    if (protection !== "all") next.set("protection", protection);
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`));
  };
  const clear = () => {
    setQuery("");
    setModule("");
    setCoverage("all");
    setProtection("all");
    const next = new URLSearchParams();
    if (effectiveRole) next.set("role", effectiveRole);
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ""}`));
  };
  async function confirm() {
    if (!pending || saving) return;
    setSaving(true);
    setMessage("");
    const previousValue = pending.record.roleValues[pending.role];
    try {
      const response = await fetch(
        `/api/admin/privileges/${encodeURIComponent(pending.record.key)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: pending.role, enabled: pending.enabled, previousValue }),
        },
      );
      await readAdminApiResponse(response, "Privilege update failed");
      setPrivileges((current) =>
        current.map((record) =>
          record.key === pending.record.key
            ? { ...record, roleValues: { ...record.roleValues, [pending.role]: pending.enabled } }
            : record,
        ),
      );
      setMessage("Privilege updated successfully.");
      setPending(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Privilege update failed.");
    } finally {
      setSaving(false);
    }
  }
  const enabledForRole = privileges.filter((record) => record.roleValues[effectiveRole] === true),
    protectedCount = privileges.filter(isProtected).length;
  return (
    <div className={`space-y-4 ${refreshing ? "opacity-70" : ""}`} aria-busy={refreshing}>
      <PageHeader
        title="Privileges & Access Control"
        description="Manage role permissions and review effective access across Radaba modules."
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={refreshing}
              onClick={() => startTransition(() => router.refresh())}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`}
                aria-hidden="true"
              />
              Refresh
            </button>
            <Link
              href="/home/admin/audit"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <History className="size-4" aria-hidden="true" />
              View audit history
            </Link>
            <button
              type="button"
              disabled={!pending}
              onClick={() => pending && setPending({ ...pending })}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            >
              <Save className="size-4" aria-hidden="true" />
              Save changes
            </button>
          </div>
        }
      />
      <section aria-label="Privilege summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total Roles", roles.length, "Existing role fields"],
          ["Total Modules", modules.length, "Existing category values"],
          [
            "Enabled Permissions",
            enabledForRole.length,
            `Strict boolean true for ${effectiveRole || "no role"}`,
          ],
          [
            "Users Affected",
            selectedSummary?.userCount ?? 0,
            "Users assigned to the selected role",
          ],
          ["Protected Privileges", protectedCount, "Administrator access gates"],
          ["Pending Changes", pending ? 1 : 0, "Awaiting review and confirmation"],
        ].map(([label, value, helper]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {String(label)}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{String(value)}</p>
            <p className="mt-1 text-xs text-slate-500">{String(helper)}</p>
          </article>
        ))}
      </section>
      <section
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(15rem,0.8fr)_minmax(0,2fr)]"
        aria-labelledby="role-selector-title"
      >
        <div>
          <h2 id="role-selector-title" className="text-sm font-semibold">
            Selected role
          </h2>
          <label className="mt-3 block text-sm font-medium">
            Role
            <select
              value={effectiveRole}
              onChange={(event) => {
                const next = new URLSearchParams(params.toString());
                next.set("role", event.target.value);
                startTransition(() => router.push(`${pathname}?${next}`));
              }}
              className={`mt-1.5 ${fieldClass}`}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800">
              {selectedSummary?.isAdministrator ? "System protected" : "Standard role"}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
              {selectedSummary?.userCount ?? 0} assigned users
            </span>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold">Effective Access</h2>
          <p className="mt-1 text-xs text-slate-500">
            Direct page access from strict boolean role fields. This model has no inheritance or
            user-level overrides.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {enabledForRole.length ? (
              enabledForRole.map((record) => (
                <code
                  key={record.key}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"
                >
                  {text(record.path)}
                </code>
              ))
            ) : (
              <span className="text-sm text-slate-500">No accessible routes for this role.</span>
            )}
          </div>
        </div>
      </section>{" "}
      {message ? (
        <p
          role="status"
          className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
        >
          {message}
        </p>
      ) : null}
      {effectiveRole ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <span>
            Role comparison focused on <strong className="break-all">{effectiveRole}</strong>.
          </span>
          <button
            type="button"
            onClick={() => router.push("/home/admin/privileges")}
            className="min-h-10 font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Show all roles
          </button>
        </div>
      ) : selectedRole ? (
        <p
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          The requested role is not part of the current role inventory. Showing all roles.
        </p>
      ) : null}
      <section
        aria-labelledby="privilege-filters"
        className="sticky top-2 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-sm lg:static lg:bg-white"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 id="privilege-filters" className="text-sm font-semibold">
              Search and filters
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Search the loaded access-control inventory without extra database reads.
            </p>
          </div>
          <p className="text-sm font-medium text-slate-600">
            {filtered.length} of {privileges.length} privileges
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_13rem_13rem_auto]"
        >
          <label className="text-sm font-medium">
            Search
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-3.5 size-4 text-slate-400"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, path, identifier, or module"
                className={`${fieldClass} pl-9`}
              />
            </div>
          </label>
          <label className="text-sm font-medium">
            Module
            <select
              value={module}
              onChange={(event) => setModule(event.target.value)}
              className={`mt-1.5 ${fieldClass}`}
            >
              <option value="">All modules</option>
              {modules.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Assignment
            <select
              value={coverage}
              onChange={(event) => setCoverage(event.target.value as Coverage)}
              className={`mt-1.5 ${fieldClass}`}
            >
              <option value="all">All assignments</option>
              <option value="assigned">Assigned to a role</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Protection
            <select
              value={protection}
              onChange={(event) => setProtection(event.target.value as Protection)}
              className={`mt-1.5 ${fieldClass}`}
            >
              <option value="all">All privileges</option>
              <option value="protected">Protected only</option>
              <option value="standard">Standard only</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-indigo-700 px-4 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={clear}
              aria-label="Clear privilege filters"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </button>
          </div>
        </form>
      </section>
      <nav
        aria-label="Privilege modules"
        className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2"
      >
        {modules.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setModule(value);
              const next = new URLSearchParams(params.toString());
              next.set("module", value);
              startTransition(() => router.push(`${pathname}?${next}`));
            }}
            className={`min-h-10 shrink-0 rounded-lg px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500 ${appliedModule === value ? "bg-indigo-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
          >
            {value}
            <span className="ml-1 text-xs opacity-75">
              {privileges.filter((record) => moduleName(record) === value).length}
            </span>
          </button>
        ))}
      </nav>
      <p className="sr-only" aria-live="polite">
        {filtered.length} privileges shown in {groups.length} modules.
      </p>
      {!privileges.length ? (
        <AdminEmptyState
          title="No privileges configured"
          description="No existing privilege records were found."
        />
      ) : !filtered.length ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <KeyRound className="mx-auto size-9 text-indigo-600" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">No privileges match these filters</h2>
          <p className="mt-2 text-sm text-slate-600">
            Adjust the criteria or clear filters to return to the loaded inventory.
          </p>
          <button
            type="button"
            onClick={clear}
            className="mt-4 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Clear Filters
          </button>
        </section>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <PrivilegeGroup
              key={group.name}
              name={group.name}
              records={group.records}
              roles={visibleRoles}
              change={setPending}
            />
          ))}
        </div>
      )}
      <aside className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
        <strong>Critical access:</strong> the `/privilege` permission controls administrator access.
        Its final Super Admin grant remains protected by the existing server policy. Privileges
        cannot be created, renamed, or deleted here.
      </aside>
      {pending ? (
        <Confirmation
          pending={pending}
          saving={saving}
          cancel={() => setPending(null)}
          confirm={confirm}
        />
      ) : null}
    </div>
  );
}

function PrivilegeGroup({
  name,
  records,
  roles,
  change,
}: {
  name: string;
  records: AdminPrivilegeRecord[];
  roles: string[];
  change: (value: PendingChange) => void;
}) {
  const assigned = new Set(
    records.flatMap((record) =>
      Object.entries(record.roleValues)
        .filter(([, value]) => value === true)
        .map(([role]) => role),
    ),
  ).size;
  return (
    <details
      open
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 bg-slate-50 px-4 py-3 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500">
        <div>
          <h2 className="font-semibold text-slate-950">{name}</h2>
          <p className="text-xs text-slate-500">
            {records.length} privileges · {assigned} assigned roles
          </p>
        </div>
        <ChevronDown
          className="size-5 transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="border-y border-slate-200 px-4 py-3 text-xs uppercase text-slate-500"
                >
                  Privilege
                </th>
                <th
                  scope="col"
                  className="border-y border-slate-200 px-4 py-3 text-xs uppercase text-slate-500"
                >
                  Path
                </th>
                <th
                  scope="col"
                  className="border-y border-slate-200 px-4 py-3 text-xs uppercase text-slate-500"
                >
                  Protection
                </th>
                <th
                  scope="col"
                  className="border-y border-slate-200 px-4 py-3 text-xs uppercase text-slate-500"
                >
                  Roles using
                </th>
                {roles.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="border-y border-slate-200 px-3 py-3 text-xs font-semibold text-slate-600"
                  >
                    <span className="block max-w-28 break-all">{role}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((record) => (
                <tr key={record.key} className="align-top hover:bg-slate-50/70">
                  <td className="max-w-sm px-4 py-4">
                    <PrivilegeIdentity record={record} />
                  </td>
                  <td className="max-w-xs px-4 py-4">
                    <code className="break-all rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                      {text(record.path)}
                    </code>
                  </td>
                  <td className="px-4 py-4">
                    <ProtectionBadge record={record} />
                  </td>
                  <td className="px-4 py-4 font-semibold tabular-nums">{rolesUsing(record)}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-3">
                      <PrivilegeToggle record={record} role={role} change={change} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid gap-3 p-3 lg:hidden">
        {records.map((record) => (
          <PrivilegeCard key={record.key} record={record} roles={roles} change={change} />
        ))}
      </div>
    </details>
  );
}
function PrivilegeIdentity({ record }: { record: AdminPrivilegeRecord }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="break-words font-semibold text-slate-950">
          {text(record.page_name, "Unnamed privilege")}
        </span>
        {isProtected(record) ? (
          <ShieldAlert className="size-4 text-red-700" aria-label="Protected privilege" />
        ) : null}
      </div>
      {record.privilege_id ? (
        <code className="mt-1 block break-all text-xs text-slate-500">
          ID: {record.privilege_id}
        </code>
      ) : null}
      {record.parent ? (
        <p className="mt-1 break-words text-xs text-slate-500">Related feature: {record.parent}</p>
      ) : null}
    </div>
  );
}
function ProtectionBadge({ record }: { record: AdminPrivilegeRecord }) {
  return isProtected(record) ? (
    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200">
      Protected · Critical
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
      Standard
    </span>
  );
}
function PrivilegeCard({
  record,
  roles,
  change,
}: {
  record: AdminPrivilegeRecord;
  roles: string[];
  change: (value: PendingChange) => void;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 p-4">
      <PrivilegeIdentity record={record} />
      <div className="mt-3">
        <ProtectionBadge record={record} />
      </div>
      <dl className="mt-3 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Path</dt>
          <dd className="mt-1">
            <code className="break-all text-xs">{text(record.path)}</code>
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Roles using</dt>
          <dd className="mt-1 font-semibold">{rolesUsing(record)}</dd>
        </div>
      </dl>
      <div
        className="mt-4 space-y-2 border-t border-slate-100 pt-3"
        aria-label={`Role assignments for ${text(record.page_name, "unnamed privilege")}`}
      >
        {roles.map((role) => (
          <div key={role} className="flex min-h-11 items-center justify-between gap-3">
            <span className="min-w-0 break-all text-sm">{role}</span>
            <PrivilegeToggle record={record} role={role} change={change} />
          </div>
        ))}
      </div>
    </article>
  );
}
function PrivilegeToggle({
  record,
  role,
  change,
}: {
  record: AdminPrivilegeRecord;
  role: string;
  change: (value: PendingChange) => void;
}) {
  const exists = Object.hasOwn(record.roleValues, role),
    checked = record.roleValues[role] === true;
  return (
    <label className="inline-flex min-h-11 items-center gap-2 text-xs">
      <input
        type="checkbox"
        checked={checked}
        disabled={!exists}
        onChange={(event) => change({ record, role, enabled: event.target.checked })}
        aria-label={`${checked ? "Disable" : "Enable"} ${text(record.page_name, "privilege")} for ${role}`}
        className="size-5 rounded focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
      />
      <span className="min-w-16">
        {exists ? (checked ? "Enabled" : "Disabled") : "Not defined"}
      </span>
    </label>
  );
}
function Confirmation({
  pending,
  saving,
  cancel,
  confirm,
}: {
  pending: PendingChange;
  saving: boolean;
  cancel: () => void;
  confirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    cancelRef.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) cancel();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [cancel, saving]);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="privilege-confirm"
        aria-describedby="privilege-confirm-description"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h2 id="privilege-confirm" className="text-lg font-semibold">
          Confirm privilege change
        </h2>
        <p id="privilege-confirm-description" className="mt-3 text-sm text-slate-600">
          Set <strong className="break-all">{pending.role}</strong> access to{" "}
          <strong>{text(pending.record.page_name, "this privilege")}</strong> as{" "}
          <strong>{pending.enabled ? "Enabled" : "Disabled"}</strong>?
        </p>
        {isProtected(pending.record) ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            This permission controls administrator access. Existing final-access protection is
            enforced by the server.
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={saving}
            onClick={cancel}
            className="min-h-11 rounded-xl border border-slate-300 px-4 font-semibold focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={confirm}
            className="min-h-11 rounded-xl bg-indigo-700 px-4 font-semibold text-white focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
