import { notFound,redirect } from "next/navigation";
import { AdminSessionError,resolveAdministrator } from "@/server/admin/admin-session";
import { AdminPermissionDenied } from "@/components/admin/admin-page-state";
import { FirebaseAuditCenterRepository } from "@/server/audit/firebase-audit-center-repository";
import { AuditDetail } from "@/components/audit/audit-center-workspace";
export const dynamic="force-dynamic";
export default async function AuditDetailPage({params,searchParams}:{params:Promise<{auditId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){try{await resolveAdministrator()}catch(error){if(error instanceof AdminSessionError&&error.status===401)redirect("/login");return <AdminPermissionDenied/>}const q=await searchParams,source=typeof q.source==="string"?q.source:"administrator_audit",parent=typeof q.parent==="string"?q.parent:"",event=await new FirebaseAuditCenterRepository().find(source,parent,(await params).auditId).catch(()=>null);if(!event)notFound();return <AuditDetail event={event}/>}