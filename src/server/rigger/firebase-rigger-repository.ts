import "server-only";
import type { DataSnapshot,Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { isRiggerRecord,mapRigger } from "@/features/rigger/rigger-mapper";
import { RIGGER_SCAN_LIMIT,type RiggerListQuery } from "@/features/rigger/rigger-query-contract";
import type { RawRiggerRecord } from "@/features/rigger/rigger-types";
import { RIGGER_RTDB_PATH,type RiggerCandidateResult,type RiggerReadRepository } from "./rigger-repository";
const lower=(value:unknown)=>String(value??"").trim().toLowerCase();
const entries=(snapshot:DataSnapshot)=>{const out:{key:string;value:RawRiggerRecord}[]=[];snapshot.forEach(child=>{out.push({key:child.key??"",value:child.val()??{}})});return out};
const matches=(raw:RawRiggerRecord,query:RiggerListQuery)=>{
  if(!isRiggerRecord(raw))return false;
  if(query.status&&String(raw.status??"")!==query.status)return false;
  if(query.company&&lower(raw.company)!==lower(query.company))return false;
  if(!query.q)return true;const q=lower(query.q);
  return [raw.name,raw.email,raw.phone,raw.company].some(value=>lower(value).includes(q));
};
export class FirebaseRiggerReadRepository implements RiggerReadRepository {
  constructor(private readonly database:Database=firebaseAdminDatabase){}
  async findByKey(key:string){const snapshot=await this.database.ref(RIGGER_RTDB_PATH).child(key).once("value");if(!snapshot.exists())return null;const raw=snapshot.val()??{};return isRiggerRecord(raw)?mapRigger(snapshot.key??key,raw):null}
  async list(query:RiggerListQuery):Promise<RiggerCandidateResult>{
    let ref=this.database.ref(RIGGER_RTDB_PATH).orderByKey();if(query.cursor)ref=ref.startAt(query.cursor);
    const raw=entries(await ref.limitToFirst(RIGGER_SCAN_LIMIT+(query.cursor?1:0)).once("value"));
    const candidates=query.cursor&&raw[0]?.key===query.cursor?raw.slice(1):raw;
    const matching=candidates.filter(({value})=>matches(value,query)),selected=matching.slice(0,query.pageSize),last=selected.at(-1);
    const lastIndex=last?candidates.findIndex(row=>row.key===last.key):-1;
    const more=matching.length>query.pageSize||(selected.length===query.pageSize&&lastIndex<candidates.length-1)||candidates.length===RIGGER_SCAN_LIMIT;
    return {rows:selected.map(({key,value})=>mapRigger(key,value)),nextCursor:more?(last?.key??candidates.at(-1)?.key??null):null,scanned:candidates.length,bounded:true};
  }
}

