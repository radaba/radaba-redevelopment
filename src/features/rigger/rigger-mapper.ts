import type { RawRiggerRecord,Rigger } from "./rigger-types";
import * as runtime from "./rigger-mapper.mjs";
export const mapRigger=(key:string,raw:RawRiggerRecord)=>runtime.mapRigger(key,raw) as Rigger;
export const isRiggerRecord=(raw:RawRiggerRecord)=>runtime.isRiggerRecord(raw) as boolean;
export const riggerInitials=(rigger:Rigger)=>runtime.riggerInitials(rigger) as string;

