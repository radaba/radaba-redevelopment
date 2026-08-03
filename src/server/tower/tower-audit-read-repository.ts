import "server-only";
import type { Database, DataSnapshot } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { mapTowerAuditEvent, type TowerAuditView } from "@/features/tower/tower-audit-contract";
const PATH="tower_audit";
export interface TowerAuditPage{rows:TowerAuditView[];nextCursor:string|null;scanned:number;bounded:true}
export class FirebaseTowerAuditReadRepository{
 constructor(private database:Database=firebaseAdminDatabase){}
 async find(towerKey:string,auditId:string):Promise<TowerAuditView|null>{const snapshot=await this.database.ref(`${PATH}/${towerKey}/${auditId}`).once("value");return snapshot.exists()?mapTowerAuditEvent(auditId,snapshot.val()):null}
 async list(towerKey:string,pageSize:number,cursor=""):Promise<TowerAuditPage>{let query=this.database.ref(`${PATH}/${towerKey}`).orderByKey();if(cursor)query=query.endAt(cursor);const snapshot=await query.limitToLast(pageSize+(cursor?1:0)).once("value"),items:{key:string;value:unknown}[]=[];snapshot.forEach((child:DataSnapshot)=>{items.push({key:child.key??"",value:child.val()})});const eligible=(cursor?items.filter(item=>item.key!==cursor):items).sort((a,b)=>b.key.localeCompare(a.key)),selected=eligible.slice(0,pageSize),rows=selected.map(item=>mapTowerAuditEvent(item.key,item.value)).filter((item):item is TowerAuditView=>item!==null);return{rows,nextCursor:eligible.length>pageSize?selected.at(-1)?.key??null:null,scanned:eligible.length,bounded:true}}
}
