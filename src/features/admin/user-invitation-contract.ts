import * as runtime from "./user-invitation-contract.mjs";
export interface UserInvitationInput { name:unknown; email:unknown; role:unknown; company:unknown; department:unknown; region:unknown; phone?:unknown }
export interface ValidUserInvitation { name:string; email:string; role:string; company:string; department:string; region:string; phone:string }
export type UserInvitationValidation={success:true;value:ValidUserInvitation}|{success:false;errors:Record<string,string>};
export const validateUserInvitation=runtime.validateUserInvitation as (input:UserInvitationInput,roles:string[])=>UserInvitationValidation;
