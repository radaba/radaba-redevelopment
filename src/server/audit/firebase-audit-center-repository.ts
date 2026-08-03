import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { normalizeAuditEvent, type AuditEvent } from "@/features/audit/audit-center";
export const AUDIT_SOURCE_LIMIT=200, AUDIT_PARENT_LIMIT=40, AUDIT_CHILD_LIMIT=50;
export interface AuditReadResult {events:AuditEvent[];unavailableSources:string[];bounded:true;sourceLimits:Record<string,number>}
const children=(snapshot:DataSnapshot)=>{const rows:DataSnapshot[]=[];snapshot.forEach(child=>{rows.push(child)});return rows};
export class FirebaseAuditCenterRepository {
 constructor(private readonly database:Database=firebaseAdminDatabase){}
 async list():Promise<AuditReadResult>{const unavailableSources:string[]=[],events:AuditEvent[]=[];await Promise.all([this.readFlat("administrator_audit",events,unavailableSources),this.readNested("assignment_audit",events,unavailableSources),this.readNested("tower_audit",events,unavailableSources)]);return{events:events.sort((a,b)=>(b.timestamp.epochMs??-Infinity)-(a.timestamp.epochMs??-Infinity)||a.sourceRoot.localeCompare(b.sourceRoot)||a.eventKey.localeCompare(b.eventKey)),unavailableSources,bounded:true,sourceLimits:{administrator_audit:AUDIT_SOURCE_LIMIT,assignment_audit:AUDIT_PARENT_LIMIT*AUDIT_CHILD_LIMIT,tower_audit:AUDIT_PARENT_LIMIT*AUDIT_CHILD_LIMIT}}}
 private async readFlat(root:string,out:AuditEvent[],failed:string[]){try{const snapshot=await this.database.ref(root).orderByKey().limitToLast(AUDIT_SOURCE_LIMIT).once("value");for(const child of children(snapshot))out.push(normalizeAuditEvent(root,"",child.key??"",child.val()))}catch{failed.push(root)}}
 private async readNested(root:string,out:AuditEvent[],failed:string[]){try{const parents=await this.database.ref(root).orderByKey().limitToLast(AUDIT_PARENT_LIMIT).once("value");for(const parent of children(parents)){const records=children(parent).slice(-AUDIT_CHILD_LIMIT);for(const child of records)out.push(normalizeAuditEvent(root,parent.key??"",child.key??"",child.val()))}}catch{failed.push(root)}}
 async find(sourceRoot:string,parentKey:string,eventKey:string){if(!["administrator_audit","assignment_audit","tower_audit"].includes(sourceRoot)||[sourceRoot,parentKey,eventKey].some(value=>/[.#$\[\]/]/.test(value)))return null;const path=sourceRoot==="administrator_audit"?`${sourceRoot}/${eventKey}`:`${sourceRoot}/${parentKey}/${eventKey}`,snapshot=await this.database.ref(path).once("value");return snapshot.exists()?normalizeAuditEvent(sourceRoot,parentKey,eventKey,snapshot.val()):null}
}