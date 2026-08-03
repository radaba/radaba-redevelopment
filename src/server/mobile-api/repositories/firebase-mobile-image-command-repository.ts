import "server-only";
import type {DataSnapshot,Database} from "firebase-admin/database";
import {firebaseAdminDatabase} from "@/lib/firebase/admin";
import {MOBILE_RTDB_PATHS} from "./mobile-repositories.mjs";
const children=(snapshot:DataSnapshot)=>{const rows:{key:string;value:Record<string,unknown>}[]=[];snapshot.forEach(child=>{rows.push({key:child.key??"",value:child.val()??{}})});return rows};
type ImageSync={assignmentKey:string;synchronizeAssignment:boolean;snapshot:Record<string,unknown>};
export class FirebaseMobileImageCommandRepository{
 constructor(private readonly database:Database=firebaseAdminDatabase,private readonly now=()=>new Date()){}
 async findAssignments(id:unknown){return children(await this.database.ref(MOBILE_RTDB_PATHS.assignment).orderByChild("assignment_id").equalTo(id as string).once("value"))}
 async upsertCell(rcellId:string,value:Record<string,unknown>){const rows=children(await this.database.ref(MOBILE_RTDB_PATHS.cell).orderByChild("rcell_id").equalTo(rcellId).once("value"));if(rows.length){for(const row of rows)await this.database.ref(`${MOBILE_RTDB_PATHS.cell}/${row.key}`).update(value)}else await this.database.ref(MOBILE_RTDB_PATHS.cell).push(value)}
 async upsertImage(assignmentId:unknown,value:Record<string,unknown>,sync?:ImageSync){
  const newImageKey=this.database.ref(MOBILE_RTDB_PATHS.image).push().key;
  if(!newImageKey)throw new Error("Image key generation failed.");
  const auditKey=sync?.synchronizeAssignment&&Object.keys(sync.snapshot).length?this.database.ref(`assignment_audit/${sync.assignmentKey}`).push().key:null;
  const outcome=await this.database.ref().transaction(root=>{
   if(!root)return root;
   root.image??={};
   const imageKeys=Object.keys(root.image).filter(key=>root.image[key]?.assignment_id===assignmentId),sourceKeys=imageKeys.length?imageKeys:[newImageKey];
   for(const key of sourceKeys)root.image[key]={...(root.image[key]??{}),...value};
   if(!sync?.synchronizeAssignment||!auditKey)return root;
   const assignment=root.assignment?.[sync.assignmentKey];
   if(!assignment||assignment.assignment_id!==assignmentId)return;
   const changed=Object.keys(sync.snapshot).filter(field=>assignment[field]!==sync.snapshot[field]);
   if(!changed.length)return root;
   const before=Object.fromEntries(changed.map(field=>[field,Object.hasOwn(assignment,field)?assignment[field]:null])),after=Object.fromEntries(changed.map(field=>[field,sync.snapshot[field]]));
   root.assignment[sync.assignmentKey]={...assignment,...after};
   root.assignment_audit??={};root.assignment_audit[sync.assignmentKey]??={};
   root.assignment_audit[sync.assignmentKey][auditKey]={audit_id:auditKey,assignment_key:sync.assignmentKey,assignment_id:String(assignmentId??""),source:"image",source_image_key:sourceKeys[0],source_image_keys:sourceKeys,action:"assignment_full_tower_synchronized",reason:"full_tower_snapshot_synchronization",actor_uid:"",actor_email:String(assignment.rigger_email??"").slice(0,320),actor_name:String(assignment.rigger_name??"").slice(0,200),occurred_at:this.now().toISOString(),changed_fields:changed,before,after};
   return root;
  },undefined,false);
  if(!outcome.committed)throw new Error("Image update could not be committed.");
 }
}
