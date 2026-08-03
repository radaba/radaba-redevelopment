import {redirect} from "next/navigation";
import {AdminSessionError,resolveAdministrator} from "@/server/admin/admin-session";
import {AdminPermissionDenied} from "@/components/admin/admin-page-state";
import {AssignmentSnapshotMaintenance} from "@/components/admin/assignment-snapshot-maintenance";
export const dynamic="force-dynamic";
export default async function AssignmentMaintenancePage(){try{await resolveAdministrator()}catch(error){if(error instanceof AdminSessionError&&error.status===401)redirect("/login");return <AdminPermissionDenied/>}return <AssignmentSnapshotMaintenance/>}
