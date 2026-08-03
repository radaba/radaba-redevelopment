import type {RawTowerRecord} from "./tower-types";
import * as runtime from "./tower-create-contract.mjs";
export interface TowerCreateInput{site_id?:string;l700?:number;l2600?:number;[field:string]:unknown}
export const TOWER_CREATE_FIELDS=runtime.TOWER_CREATE_FIELDS as readonly string[];
export const parseTowerCreateInput=(input:unknown)=>runtime.parseTowerCreateInput(input) as RawTowerRecord&{tower_id:string;sitename:string;region:string;new_cluster_name:string;latitude:number;longitude:number};
