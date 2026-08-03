import "server-only";
import { ADMINISTRATOR_ROLE } from "@/features/admin/admin-authorization";
import { ADMIN_USER_STATUSES,type AdminUserRecord,type AdminUserStatus } from "@/features/admin/admin-types";
import { recordAdministratorAudit,type AdministratorAuditAppendRepository } from "@/features/admin/administrator-audit-contract";
import { AdminCommandError } from "./admin-errors";
import type { NotificationProducer } from "@/server/notification/firebase-notification-producer";
export interface AccountLifecycleRepository {findUser(key:string):Promise<AdminUserRecord|null>;countActiveAdministrators():Promise<number>;updateUserStatusField(key:string,status:AdminUserStatus):Promise<void>}
export interface AccountLifecycleAuth {revoke(uid:string):Promise<void>}
export interface AccountLifecycleContext {actorUid:string;actorEmail:string;requestIdentifier:string;ipAddress:string|null;userAgent:string|null}
export class UserAccountLifecycleService{
 constructor(private readonly repository:AccountLifecycleRepository,private readonly auth:AccountLifecycleAuth,private readonly audit:AdministratorAuditAppendRepository,private readonly notifications?:NotificationProducer){}
 async changeStatus(input:{targetUserKey:string;status:unknown;previousStatus:unknown;confirmed:unknown},context:AccountLifecycleContext){
  if(input.confirmed!==true)throw new AdminCommandError("MALFORMED","Confirm the account status change.");
  if(typeof input.status!=="string"||typeof input.previousStatus!=="string"||!ADMIN_USER_STATUSES.includes(input.status as AdminUserStatus))throw new AdminCommandError("INVALID_VALUE","Status is not supported.");
  const target=await this.target(input.targetUserKey);if(target.status!==input.previousStatus)throw new AdminCommandError("CONFLICT","The user status changed. Refresh and retry.");
  if(target.status===input.status)return target;
  if(target.role===ADMINISTRATOR_ROLE&&input.status==="Not Active"&&String(target.status).toLowerCase()==="active"&&await this.repository.countActiveAdministrators()<=1)throw new AdminCommandError("CONFLICT","The final active administrator cannot be deactivated.");
  const desiredInactive=input.status==="Not Active";
  try{await this.repository.updateUserStatusField(input.targetUserKey,input.status as AdminUserStatus);}catch{throw new AdminCommandError("UNAVAILABLE","The application status could not be updated. Retry the change.");}
  if(desiredInactive&&target.uid)try{await this.auth.revoke(target.uid);}catch{console.warn("User status changed but session revocation failed",{targetUserKey:input.targetUserKey,requestIdentifier:context.requestIdentifier});}
  const action=desiredInactive?"user.deactivated":"user.reactivated";
  await recordAdministratorAudit(this.audit,{administratorIdentifier:context.actorUid,administratorEmail:context.actorEmail,action,resourceType:"user",resourceIdentifier:input.targetUserKey,summary:desiredInactive?"User Deactivated":"User Activated",before:{status:target.status},after:{status:input.status},requestIdentifier:context.requestIdentifier,ipAddress:context.ipAddress,userAgent:context.userAgent});
  await this.notifications?.deliver({type:desiredInactive?"user_deactivated":"user_reactivated",category:"administration",title:desiredInactive?"Account deactivated":"Account reactivated",message:`Your Radaba account was ${desiredInactive?"deactivated":"reactivated"}.`,recipientUserKeys:[input.targetUserKey],recipientEmails:[context.actorEmail],targetType:"user",targetKey:input.targetUserKey,severity:desiredInactive?"critical":"info",operationId:`user-status:${input.targetUserKey}:${target.status}:${input.status}`});
  return {...target,status:input.status};
 }
 async revokeSessions(input:{targetUserKey:string;confirmed:unknown;confirmSelf:unknown},context:AccountLifecycleContext){if(input.confirmed!==true)throw new AdminCommandError("MALFORMED","Confirm session revocation.");const target=await this.target(input.targetUserKey),uid=requiredUid(target);if(uid===context.actorUid&&input.confirmSelf!==true)throw new AdminCommandError("CONFLICT","Confirm that you want to revoke your own sessions.");try{await this.auth.revoke(uid);}catch{throw new AdminCommandError("UNAVAILABLE","Firebase sessions could not be revoked.");}await recordAdministratorAudit(this.audit,{administratorIdentifier:context.actorUid,administratorEmail:context.actorEmail,action:"user.session.revoked",resourceType:"user",resourceIdentifier:input.targetUserKey,summary:"Revoked all user refresh tokens.",before:{sessions:"active_or_unknown"},after:{sessions:"revoked"},requestIdentifier:context.requestIdentifier,ipAddress:context.ipAddress,userAgent:context.userAgent});return {revoked:true};}
 private async target(key:string){const target=await this.repository.findUser(key);if(!target)throw new AdminCommandError("NOT_FOUND","User was not found.");return target;}
}
function requiredUid(target:AdminUserRecord){const uid=target.uid?.trim();if(!uid)throw new AdminCommandError("CONFLICT","The application profile has no usable Firebase UID.");return uid;}
