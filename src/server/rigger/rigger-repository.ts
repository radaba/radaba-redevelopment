import type { Rigger } from "@/features/rigger/rigger-types";
import type { RiggerListQuery } from "@/features/rigger/rigger-query-contract";
export const RIGGER_RTDB_PATH="user";
export interface RiggerCandidateResult {rows:Rigger[];nextCursor:string|null;scanned:number;bounded:true}
export interface RiggerReadRepository {
  list(query:RiggerListQuery):Promise<RiggerCandidateResult>;
  findByKey(key:string):Promise<Rigger|null>;
}

