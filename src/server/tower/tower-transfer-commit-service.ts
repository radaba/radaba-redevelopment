import { parseTowerCreateInput } from "@/features/tower/tower-create-contract";
import { buildTowerAuditEvent, type TowerAuditActor } from "@/features/tower/tower-audit-contract";
import { previewTowerRows, type ParsedTransfer, type PreviewRow } from "@/features/tower/tower-transfer-contract";
import type { RawTowerRecord, TowerScalar } from "@/features/tower/tower-types";
import type { TowerCommandRepository } from "./tower-command-repository";
import { TOWER_MATCH_SCAN_LIMIT } from "@/features/tower/tower-transfer-contract";

export type TowerTransferCommitStatus="created"|"updated"|"unchanged"|"blocked"|"conflict"|"failed";
export interface TowerTransferCommitRow{rowNumber:number;towerId:string;firebaseKey:string|null;result:TowerTransferCommitStatus;changedFields:string[];errorCode:string|null;message:string}
export interface TowerTransferCommitResult{totalRows:number;created:number;updated:number;unchanged:number;blocked:number;conflicts:number;failed:number;rows:TowerTransferCommitRow[]}
export interface TowerTransferReadRepository{boundedEntries(limit:number):Promise<{entries:{key:string;record:RawTowerRecord}[];overflow:boolean}>}
export class TowerTransferCommitError extends Error{constructor(public readonly code:string,message:string,public readonly status=400){super(message)}}
const blocked=(row:PreviewRow):TowerTransferCommitRow=>({rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:row.matched?.firebaseKey??null,result:"blocked",changedFields:[],errorCode:row.messages[0]?.code??"row_blocked",message:row.messages[0]?.message??`Row classification ${row.classification} is not eligible for import.`});
const safeFailure=(row:PreviewRow):TowerTransferCommitRow=>({rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:row.matched?.firebaseKey??null,result:"failed",changedFields:[],errorCode:"row_failed",message:"Tower import failed for this row."});
const scalar=(value:unknown):TowerScalar=>value===null||["string","number","boolean"].includes(typeof value)?value as TowerScalar:null;
export class TowerTransferCommitService{
 constructor(private readonly reads:TowerTransferReadRepository,private readonly commands:TowerCommandRepository,private readonly now=()=>new Date()){}
 async commit(parsed:ParsedTransfer,actor:TowerAuditActor):Promise<TowerTransferCommitResult>{
  if(!String(actor.uid??"").trim())throw new TowerTransferCommitError("UNAUTHORIZED_ACTOR","A verified administrator actor is required.",403);
  const existing=await this.reads.boundedEntries(TOWER_MATCH_SCAN_LIMIT);
  if(existing.overflow)throw new TowerTransferCommitError("MATCH_CAPACITY",`Tower matching exceeds the safe ${TOWER_MATCH_SCAN_LIMIT}-record bound. Import was stopped.`,409);
  const preview=previewTowerRows(parsed,existing.entries),results:TowerTransferCommitRow[]=[];
  for(const row of preview.rows){
   if(["invalid","duplicate","ambiguous"].includes(row.classification)){results.push(blocked(row));continue}
   if(row.classification==="unchanged"){results.push({rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:row.matched?.firebaseKey??null,result:"unchanged",changedFields:[],errorCode:null,message:"No changes were required."});continue}
   try{results.push(row.classification==="new"?await this.create(row,actor):await this.update(parsed,row,actor))}catch{results.push(safeFailure(row))}
  }
  const count=(status:TowerTransferCommitStatus)=>results.filter(row=>row.result===status).length;
  return{totalRows:results.length,created:count("created"),updated:count("updated"),unchanged:count("unchanged"),blocked:count("blocked"),conflicts:count("conflict"),failed:count("failed"),rows:results};
 }
 private async create(row:PreviewRow,actor:TowerAuditActor):Promise<TowerTransferCommitRow>{
  let record:RawTowerRecord;
  try{record=parseTowerCreateInput(Object.fromEntries(Object.entries(row.original).filter(([field,value])=>field!=="firebase_key"&&value!=="")))}catch(error){return{...blocked(row),errorCode:"invalid_create",message:error instanceof Error?error.message:"New Tower validation failed."}}
  const key=this.commands.reserveKey(),auditId=this.commands.reserveAuditKey(key),audit=buildTowerAuditEvent({auditId,entityKey:key,towerId:String(record.tower_id),action:"tower_imported",source:"bulk_import",actor,occurredAt:this.now().toISOString(),after:record}),outcome=await this.commands.createIfTowerIdAvailable(key,record,audit);
  if(outcome.outcome==="duplicate")return{rowNumber:row.rowNumber,towerId:String(record.tower_id),firebaseKey:outcome.key,result:"conflict",changedFields:[],errorCode:"tower_already_exists",message:"Tower ID was created or changed after validation."};
  return{rowNumber:row.rowNumber,towerId:String(record.tower_id),firebaseKey:key,result:"created",changedFields:Object.keys(record).sort(),errorCode:null,message:"Tower created and audited."};
 }
 private async update(parsed:ParsedTransfer,row:PreviewRow,actor:TowerAuditActor):Promise<TowerTransferCommitRow>{
  const key=row.matched?.firebaseKey;if(!key)return blocked(row);
  const current=await this.commands.findByKey(key);
  if(!current)return{rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:key,result:"conflict",changedFields:[],errorCode:"tower_not_found",message:"Tower no longer exists."};
  const source=parsed.rows.find(candidate=>candidate.rowNumber===row.rowNumber)!;
  const latest=previewTowerRows({headers:parsed.headers,rows:[source]},[{key,record:current}]).rows[0];
  if(latest.classification==="unchanged")return{rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:key,result:"unchanged",changedFields:[],errorCode:null,message:"No changes were required."};
  if(latest.classification!=="changed")return{...blocked(latest),firebaseKey:key};
  const updates=Object.fromEntries(latest.differences.map(item=>[item.field,scalar(item.proposedValue)])),expected=Object.fromEntries(latest.differences.map(item=>[item.field,scalar(current[item.field])]));
  const before=Object.fromEntries(latest.differences.map(item=>[item.field,scalar(current[item.field])])),after=Object.fromEntries(latest.differences.map(item=>[item.field,scalar(item.proposedValue)]));
  const auditId=this.commands.reserveAuditKey(key),audit=buildTowerAuditEvent({auditId,entityKey:key,towerId:String(current.tower_id),action:"tower_updated",source:"bulk_import",actor,occurredAt:this.now().toISOString(),before,after}),outcome=await this.commands.updateFieldsWithAudit(key,updates,expected,audit);
  if(outcome!=="updated")return{rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:key,result:"conflict",changedFields:[],errorCode:outcome==="not_found"?"tower_not_found":"stale_conflict",message:outcome==="not_found"?"Tower no longer exists.":"Tower changed during import; no values were overwritten."};
  return{rowNumber:row.rowNumber,towerId:row.towerId,firebaseKey:key,result:"updated",changedFields:Object.keys(updates).sort(),errorCode:null,message:"Tower changes saved and audited."};
 }
}