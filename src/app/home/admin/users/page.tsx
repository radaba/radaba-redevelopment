import { redirect } from "next/navigation";
import { resolveAdministrator, AdminSessionError } from "@/server/admin/admin-session";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { AdminUsersClient } from "@/components/admin/admin-users-client";
import { AdminPermissionDenied } from "@/components/admin/admin-page-state";

import { adminUserFilterOptions, buildAdminUserList, type AdminUserListSearchParams } from "@/features/admin/admin-user-list";
import { administratorAssignableRoleIds } from "@/features/admin/administrator-role-contract";
import { supportedRolesFromRecords } from "@/server/admin/firebase-admin-data-repository";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<AdminUserListSearchParams> }) {
  try {
    await resolveAdministrator();
  } catch (error) {
    if (error instanceof AdminSessionError && error.status === 401) redirect("/login");
    return <AdminPermissionDenied />;
  }
  const repository = new FirebaseAdminDataRepository();
  const [users, privileges, params] = await Promise.all([repository.listUsers(), repository.listPrivileges(), searchParams]);
  const result = buildAdminUserList(users, params);
  return <AdminUsersClient initialUsers={result.users} roles={administratorAssignableRoleIds()} filterRoles={supportedRolesFromRecords(users,privileges)} filterOptions={adminUserFilterOptions(users)} list={result} />;
}
