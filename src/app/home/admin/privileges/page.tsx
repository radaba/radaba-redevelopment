import { redirect } from "next/navigation";
import { resolveAdministrator, AdminSessionError } from "@/server/admin/admin-session";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { AdminPrivilegesClient } from "@/components/admin/admin-privileges-client";
import { AdminPermissionDenied } from "@/components/admin/admin-page-state";

export const dynamic = "force-dynamic";

export default async function AdminPrivilegesPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  try {
    await resolveAdministrator();
  } catch (error) {
    if (error instanceof AdminSessionError && error.status === 401) redirect("/login");
    return <AdminPermissionDenied />;
  }
  const repository = new FirebaseAdminDataRepository();
  const [privileges, roles, roleSummaries, params] = await Promise.all([
    repository.listPrivileges(),
    repository.supportedRoles(),
    repository.listRoles(),
    searchParams,
  ]);
  const requestedRole = Array.isArray(params.role) ? params.role[0] : params.role;
  return (
    <AdminPrivilegesClient
      initialPrivileges={privileges}
      roles={roles}
      selectedRole={requestedRole}
      roleSummaries={roleSummaries}
    />
  );
}
