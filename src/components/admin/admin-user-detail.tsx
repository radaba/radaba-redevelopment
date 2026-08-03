import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Fingerprint,
  History,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { AdminUserDetailDto } from "@/features/admin/admin-user-detail";
import { PageHeader } from "@/components/application-shell/page-header";
import { AdminUserIdentityRepair } from "./admin-user-identity-repair";
const shown = (value: string | null) => value || "Not available";
export function AdminUserDetail({ detail }: { detail: AdminUserDetailDto }) {
  const { user } = detail;
  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name || "Unnamed user"}
        description="Read-only application profile and effective access"
        breadcrumb={
          <Link
            href="/home/admin/users"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to Users
          </Link>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminUserIdentityRepair userKey={user.key} />
            <Badge value={user.role || "Unknown role"} tone="indigo" />
            <Badge
              value={user.status || "Unknown status"}
              tone={user.status === "Active" ? "green" : "red"}
            />
          </div>
        }
      />
      {detail.currentAdministrator ? (
        <p
          role="status"
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
        >
          This profile matches the current administrator by {detail.identityMatch.toUpperCase()}.
        </p>
      ) : null}
      {detail.warnings.length ? (
        <section
          aria-labelledby="integrity-heading"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
        >
          <h2
            id="integrity-heading"
            className="flex items-center gap-2 font-semibold text-amber-950"
          >
            <AlertTriangle aria-hidden="true" className="size-5" />
            Data integrity notes
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {detail.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <section
        aria-labelledby="identity-heading"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 id="identity-heading" className="flex items-center gap-2 text-lg font-semibold">
          <UserRound aria-hidden="true" className="size-5 text-indigo-700" />
          Identity summary
        </h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Record key" value={user.key} mono />
          <Field label="Firebase UID" value={user.uid} mono />
          <Field label="Email" value={user.email} />
          <Field label="Name" value={user.name} />
          <Field label="Stored role" value={user.role} mono />
          <Field label="Privilege key" value={detail.mappedPrivilegeKey} mono />
          <Field label="Role contract state" value={detail.roleContractState} />
        </dl>
      </section>
      <Authentication auth={detail.auth} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Section
          title="Application profile"
          icon={<UserRound aria-hidden="true" className="size-5 text-indigo-700" />}
        >
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="Company / Partner" value={user.company} />
            <Field label="Department" value={user.department} />
            <Field label="Region" value={user.region} />
            <Field label="Sub-region" value={user.subRegion} />
            <Field label="Phone" value={user.phone} />
            <Field label="Position" value={user.position} />
            <Field label="Office location" value={user.officeLocation} />
            <Field label="User type" value={user.type} />
            <Field label="Partner email" value={user.emailPartner} />
            <Field label="Huawei email" value={user.emailHuawei} />
          </dl>
        </Section>
        <Section
          title="Legacy profile fields"
          icon={<KeyRound aria-hidden="true" className="size-5 text-indigo-700" />}
        >
          <p className="mb-4 text-sm text-slate-600">
            Labels preserve existing field names where their business meaning is not confirmed.
          </p>
          <dl className="grid gap-4 sm:grid-cols-2">
            <Field label="IC number" value={user.employeeIdentifier} />
            <Field label="Mateline ID" value={user.matelineId} />
            <Field label="Join date" value={user.joinDate} />
            <Field label="Create date" value={user.createDate} />
            <Field label="Level PO" value={user.levelPo} />
            <Field label="Supervisor L1" value={user.supervisorL1} />
            <Field label="Supervisor L2" value={user.supervisorL2} />
            <Field label="Supervisor L3" value={user.supervisorL3} />
            <Field label="Uniportal account" value={user.uniportalAccount} />
            <Field label="WAH rigger" value={user.wahRigger} />
            <Field label="SAM OWS" value={user.samOws} />
            <Field
              label="Legacy disabled"
              value={user.disabled === null ? null : String(user.disabled)}
            />
          </dl>
        </Section>
      </div>
      <section
        aria-labelledby="privileges-heading"
        className="rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="p-5">
          <h2 id="privileges-heading" className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck aria-hidden="true" className="size-5 text-indigo-700" />
            Effective privileges
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Role <strong>{user.role || "Unknown"}</strong> ·{" "}
            {detail.privilegeContract === "mapped"
              ? "strict privilege fields found"
              : "no matching privilege field"}
            . Only strict boolean values are interpreted.
          </p>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Page", "Path", "Category", "Access"].map((label) => (
                  <th
                    key={label}
                    scope="col"
                    className="border-y px-5 py-3 text-xs font-semibold uppercase text-slate-600"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {detail.privileges.map((item) => (
                <tr key={item.key}>
                  <td className="px-5 py-3 font-medium">{shown(item.pageName)}</td>
                  <td className="px-5 py-3 font-mono text-xs">{shown(item.path)}</td>
                  <td className="px-5 py-3">{shown(item.category)}</td>
                  <td className="px-5 py-3">
                    <Access value={item.enabled} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y md:hidden">
          {detail.privileges.map((item) => (
            <li key={item.key} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{shown(item.pageName)}</h3>
                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {shown(item.path)}
                  </p>
                </div>
                <Access value={item.enabled} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{shown(item.category)}</p>
            </li>
          ))}
        </ul>
      </section>
      <Section
        title="Account history availability"
        icon={<History aria-hidden="true" className="size-5 text-indigo-700" />}
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Application create date" value={user.createDate} />
          <Field label="Application join date" value={user.joinDate} />
          <Field label="Auth account created" value={detail.auth.creationTime} />
          <Field label="Auth last sign-in" value={detail.auth.lastSignInTime} />
          <Field label="Role change history" value={null} />
          <Field label="Status change history" value={null} />
          <Field label="Administrative audit history" value={null} />
        </dl>
        <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Firebase Authentication dates are current account metadata, not an event history. No
          persistent role, status, or administrator audit history currently exists.
        </p>
        {detail.finalAdministratorProtectionAppliesAtWrite ? (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Final-active-administrator protection is evaluated by the server when a role or status
            change is submitted. This page does not perform a full user-count read.
          </p>
        ) : null}
      </Section>
    </div>
  );
}
function Authentication({ auth }: { auth: AdminUserDetailDto["auth"] }) {
  const messages = {
    no_uid:
      "Authentication metadata is unavailable because this application profile has no usable Firebase UID.",
    not_found: "No Firebase Authentication account was found for the stored UID.",
    unavailable:
      "Firebase Authentication metadata could not be retrieved. The application profile remains available.",
    available: "",
  } as const;
  return (
    <section
      aria-labelledby="authentication-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 id="authentication-heading" className="flex items-center gap-2 text-lg font-semibold">
        <Fingerprint aria-hidden="true" className="size-5 text-indigo-700" />
        Authentication
      </h2>
      {auth.state !== "available" ? (
        <p role="status" className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          {messages[auth.state]}
        </p>
      ) : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="UID" value={auth.uid} mono />
          <Field label="Email" value={auth.email} />
          <Field
            label="Email Verified"
            value={auth.emailVerified === null ? null : auth.emailVerified ? "Yes" : "No"}
          />
          <Field
            label="Disabled"
            value={auth.disabled === null ? null : auth.disabled ? "Yes" : "No"}
          />
          <Field label="Account Created" value={auth.creationTime} />
          <Field label="Last Sign In" value={auth.lastSignInTime} />
          <Field
            label="Providers"
            value={auth.providers.length ? auth.providers.join(", ") : "None reported"}
          />
        </dl>
      )}
    </section>
  );
}
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
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
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`mt-1 break-words text-sm text-slate-900 ${mono ? "font-mono text-xs" : ""}`}>
        {shown(value)}
      </dd>
    </div>
  );
}
function Badge({ value, tone }: { value: string; tone: "indigo" | "green" | "red" }) {
  const colors =
    tone === "green"
      ? "bg-emerald-50 text-emerald-800"
      : tone === "red"
        ? "bg-red-50 text-red-800"
        : "bg-indigo-50 text-indigo-800";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors}`}>{value}</span>;
}
function Access({ value }: { value: boolean | null }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${value === true ? "bg-emerald-50 text-emerald-800" : value === false ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800"}`}
    >
      {value === true ? "Enabled" : value === false ? "Disabled" : "Not defined"}
    </span>
  );
}
