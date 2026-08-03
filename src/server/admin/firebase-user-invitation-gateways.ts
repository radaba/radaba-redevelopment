import "server-only";
import type { Auth } from "firebase-admin/auth";
import type { Database } from "firebase-admin/database";
import { firebaseAdminAuth,firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { ValidUserInvitation } from "@/features/admin/user-invitation-contract";
import { FirebaseAdminDataRepository } from "./firebase-admin-data-repository";
import type { InvitationAuthGateway,InvitationUserRepository } from "./user-invitation-service";

const code=(error:unknown)=>typeof error==="object"&&error!==null&&"code" in error?String(error.code):"";
export class FirebaseInvitationAuthGateway implements InvitationAuthGateway {
 constructor(private readonly auth:Auth=firebaseAdminAuth){}
 async emailExists(email:string){try{await this.auth.getUserByEmail(email);return true;}catch(error){if(code(error)==="auth/user-not-found")return false;throw error;}}
 async create(email:string,password:string,name:string){const user=await this.auth.createUser({email,password,displayName:name,emailVerified:false,disabled:false});return {uid:user.uid};}
 async remove(uid:string){await this.auth.deleteUser(uid);}
}
export class FirebaseInvitationUserRepository implements InvitationUserRepository {
 constructor(private readonly database:Database=firebaseAdminDatabase,private readonly adminData=new FirebaseAdminDataRepository(database)){}
 supportedRoles(){return this.adminData.supportedRoles();}
 async emailExists(email:string){const snapshot=await this.database.ref("user").once("value"),target=email.toLowerCase();let found=false;snapshot.forEach((child)=>{const value=child.val() as Record<string,unknown>|null;if(typeof value?.email==="string"&&value.email.trim().toLowerCase()===target)found=true;});return found;}
 async create(uid:string,input:ValidUserInvitation){const reference=this.database.ref("user").push();if(!reference.key)throw new Error("User identifier generation failed.");const profile:Record<string,string>={uid,name:input.name,email:input.email,role:input.role,status:"Active",company:input.company,department:input.department,region:input.region};if(input.phone)profile.phone=input.phone;await reference.set(profile);return {key:reference.key};}
}
