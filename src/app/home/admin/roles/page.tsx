import { redirect } from "next/navigation";
import { resolveAdministrator, AdminSessionError } from "@/server/admin/admin-session";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { AdminRolesClient } from "@/components/admin/admin-roles-client";
import { AdminPermissionDenied } from "@/components/admin/admin-page-state";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  try {
    await resolveAdministrator();
  } catch (error) {
    if (error instanceof AdminSessionError && error.status === 401) redirect("/login");
    return <AdminPermissionDenied />;
  }
  const roles = await new FirebaseAdminDataRepository().listRoles();
  return <AdminRolesClient roles={roles} />;
}
