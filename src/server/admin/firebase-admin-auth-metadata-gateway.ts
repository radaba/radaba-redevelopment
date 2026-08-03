import "server-only";
import type { Auth } from "firebase-admin/auth";
import { firebaseAdminAuth } from "@/lib/firebase/admin";
import { emptyAdminAuthMetadata,sanitizeAdminAuthRecord,type AdminAuthMetadata } from "@/features/admin/admin-user-detail";
import type { AdminAuthMetadataGateway } from "./admin-auth-metadata-gateway";
const errorCode=(error:unknown)=>typeof error==="object"&&error!==null&&"code" in error?String(error.code):"";
export class FirebaseAdminAuthMetadataGateway implements AdminAuthMetadataGateway {
 constructor(private readonly auth:Auth=firebaseAdminAuth){}
 async read(uid:string):Promise<AdminAuthMetadata>{try{return sanitizeAdminAuthRecord(await this.auth.getUser(uid));}catch(error){return emptyAdminAuthMetadata(errorCode(error)==="auth/user-not-found"?"not_found":"unavailable");}}
}
