import { NextResponse } from "next/server";
import { FirebaseTowerReadRepository } from "@/server/tower/firebase-tower-repository";
import { resolveTowerActor } from "@/server/tower/tower-session";
import { towerApiError } from "@/server/tower/tower-api";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { FirebaseTowerCommandRepository } from "@/server/tower/firebase-tower-command-repository";
import { FirebaseTowerAssignmentImpactRepository } from "@/server/tower/firebase-tower-assignment-impact-repository";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";
import { TowerAssignmentImpactError, TowerAssignmentImpactService } from "@/server/tower/tower-assignment-impact-service";
import { towerAuditActor } from "@/server/tower/tower-audit-session";
import {logTowerRuntime} from "@/lib/firebase/runtime-debug";
const validKey = (key: string) => /^[A-Za-z0-9_-]{1,160}$/.test(key);
export async function GET(_request: Request, context: { params: Promise<{ towerKey: string }> }) {
  try {
    await resolveTowerActor();
    const { towerKey } = await context.params;
    if (!validKey(towerKey)) return NextResponse.json({ success: false, error: "Invalid Tower key." }, { status: 400 });
    const data = await new FirebaseTowerReadRepository().findByKey(towerKey);
    if (!data) return NextResponse.json({ success: false, error: "Tower not found." }, { status: 404 });
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return towerApiError(error); }
}
export async function PATCH(request:Request,context:{params:Promise<{towerKey:string}>}){try{const user=await resolveAdministrator();const{towerKey}=await context.params;logTowerRuntime("patch-route",towerKey,{path:`tower/${towerKey}`});if(!validKey(towerKey))return NextResponse.json({success:false,error:"Invalid Tower key."},{status:400});const body=await request.json().catch(()=>null);
const notificationOperationId=`tower-update:${towerKey}:${String(body?.impactToken??"")}`;
const data=await new TowerAssignmentImpactService(new FirebaseTowerCommandRepository(),new FirebaseTowerAssignmentImpactRepository()).commit(towerKey,body,towerAuditActor(user));
await new FirebaseNotificationProducer().deliver({type:data.assignmentSync.updatedCount>0?"tower_assignments_synchronized":"tower_updated",category:"tower",title:data.assignmentSync.updatedCount>0?"Tower synchronized to Assignments":"Tower updated",message:data.assignmentSync.updatedCount>0?`Tower ${data.tower_id} was updated and synchronized to ${data.assignmentSync.updatedCount} active Assignment(s).`:`Tower ${data.tower_id} was updated.`,recipientEmails:[String(user.email)],actorName:String(user.name),targetType:"tower",targetKey:towerKey,targetId:String(data.tower_id),route:`/home/towers/${encodeURIComponent(towerKey)}`,operationId:`${notificationOperationId}:${data.assignmentSync.mode}`});return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){if(error instanceof TowerAssignmentImpactError)return NextResponse.json({success:false,error:error.message,code:error.code},{status:error.code==="NOT_FOUND"?404:["CONFLICT","IMPACT_CONFLICT"].includes(error.code)?409:error.code==="BLOCKED"||error.code==="OVERFLOW"?422:400});return adminApiError(error)}}
