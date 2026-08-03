import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { UserDeletePreviewService } from "@/server/admin/user-delete-preview-service";
export async function GET(_request:Request,{params}:{params:Promise<{userKey:string}>}) { try { await resolveAdministrator(); const user=await new FirebaseAdminDataRepository().findUser((await params).userKey); if(!user)return NextResponse.json({success:false,error:"User was not found."},{status:404}); const data=await new UserDeletePreviewService().preview(user); return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}}); } catch(error) { return adminApiError(error); } }