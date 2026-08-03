import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import type { NextRequest } from "next/server";
import { UserInvitationService } from "@/server/admin/user-invitation-service";
import { FirebaseInvitationAuthGateway,FirebaseInvitationUserRepository } from "@/server/admin/firebase-user-invitation-gateways";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await resolveAdministrator();
    const users = await new FirebaseAdminDataRepository().listUsers();
    return NextResponse.json({ success: true, data: users }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function POST(request:NextRequest){
 try{
  const actor=await resolveAdministrator(),context=administratorAuditRequestContext(request),body=await request.json();
  const data=await new UserInvitationService(new FirebaseInvitationUserRepository(),new FirebaseInvitationAuthGateway(),new FirebaseAdministratorAuditRepository()).invite(body,{actorUid:actor.uid,actorEmail:actor.email??"",...context});
  return NextResponse.json({success:true,data},{status:201,headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return adminApiError(error);}
}
