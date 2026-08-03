import {NextResponse} from "next/server";
import {resolveAdministrator} from "@/server/admin/admin-session";
import {adminApiError} from "@/server/admin/admin-api";
import {readTowerPreviewFile} from "@/server/tower/tower-transfer-file";
import {TowerTransferRepository} from "@/server/tower/tower-transfer-repository";
import {FirebaseTowerCommandRepository} from "@/server/tower/firebase-tower-command-repository";
import {TowerTransferCommitError,TowerTransferCommitService} from "@/server/tower/tower-transfer-commit-service";
import {TowerTransferError} from "@/features/tower/tower-transfer-contract";
import {FirebaseNotificationProducer} from "@/server/notification/firebase-notification-producer";
import {towerAuditActor} from "@/server/tower/tower-audit-session";
export async function POST(request:Request){
 try{
  const user=await resolveAdministrator();
  const{filename,parsed}=await readTowerPreviewFile(request);
  const data=await new TowerTransferCommitService(new TowerTransferRepository(),new FirebaseTowerCommandRepository()).commit(parsed,towerAuditActor(user));
  await new FirebaseNotificationProducer().deliver({type:"tower_import_completed",category:"system",title:"Tower import completed",message:"Tower import completed successfully.",recipientEmails:[String(user.email)],actorName:String(user.name),targetType:"import",severity:"info",operationId:`tower-import:${filename}:${String(data.created??data.updated??"completed")}`});
  return NextResponse.json({success:true,data:{filename,completedAt:new Date().toISOString(),...data}},{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof TowerTransferError)return NextResponse.json({success:false,code:error.code,error:error.message},{status:400});
  if(error instanceof TowerTransferCommitError)return NextResponse.json({success:false,code:error.code,error:error.message},{status:error.status});
  return adminApiError(error);
 }
}