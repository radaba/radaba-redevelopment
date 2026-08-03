import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { canAdministrate } from "@/features/admin/admin-authorization";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { TowerImportExportPage } from "@/components/tower/tower-import-export-page";
export const dynamic="force-dynamic";
export default async function TowerImportExportRoute(){const user=await resolveAuthenticatedUser();if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Permission denied</h1><p className="mt-2 text-sm">Tower read permission is required.</p></section>;return <TowerImportExportPage canPreview={canAdministrate(user)}/>}