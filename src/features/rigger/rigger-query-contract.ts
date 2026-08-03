import * as runtime from "./rigger-query-contract.mjs";
export interface RiggerListQuery {q:string;status:string;company:string;pageSize:number;cursor:string|null}
export type RiggerSearchParams=Record<string,string|string[]|undefined>;
export const RIGGER_PAGE_SIZES=runtime.RIGGER_PAGE_SIZES as readonly number[];
export const RIGGER_SCAN_LIMIT=runtime.RIGGER_SCAN_LIMIT as 500;
export const parseRiggerQuery=(input:RiggerSearchParams)=>runtime.parseRiggerQuery(input) as RiggerListQuery;
