import { notFound, redirect } from "next/navigation";
import { AdminPermissionDenied } from "@/components/admin/admin-page-state";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
import { validAdminUserKey } from "@/features/admin/admin-user-detail";
import { AdminSessionError, resolveAdministrator } from "@/server/admin/admin-session";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { AdminUserDetailService } from "@/server/admin/admin-user-detail-service";
import { FirebaseAdminAuthMetadataGateway } from "@/server/admin/firebase-admin-auth-metadata-gateway";
export const dynamic="force-dynamic";
export default async function AdminUserDetailPage({params}:{params:Promise<{userKey:string}>}){
 let actor;try{actor=await resolveAdministrator();}catch(error){if(error instanceof AdminSessionError&&error.status===401)redirect("/login");return <AdminPermissionDenied/>;}
 const {userKey}=await params;if(!validAdminUserKey(userKey))notFound();
 const detail=await new AdminUserDetailService(new FirebaseAdminDataRepository(),new FirebaseAdminAuthMetadataGateway()).read(userKey,actor);
 if(!detail)notFound();return <AdminUserDetail detail={detail}/>;
}
