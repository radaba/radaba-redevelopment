import type {RawAssignmentRecord,RawAssignmentSnapshotEntry} from "@/features/assignment/assignment-types";
import type {RawTowerRecord,TowerScalar} from "./tower-types";
import * as runtime from "./tower-assignment-impact-contract.mjs";
export const TOWER_ASSIGNMENT_SYNC_LIMIT=runtime.TOWER_ASSIGNMENT_SYNC_LIMIT as 100;
export const TOWER_ASSIGNMENT_SYNC_FIELDS=runtime.TOWER_ASSIGNMENT_SYNC_FIELDS as readonly string[];
export const TOWER_ASSIGNMENT_DERIVED_FIELDS=runtime.TOWER_ASSIGNMENT_DERIVED_FIELDS as Readonly<Record<string,string>>;
export type AssignmentSyncEligibility="eligible"|"historical"|"blocked";
export interface TowerAssignmentImpactRow{assignmentKey:string;status:string;eligibility:AssignmentSyncEligibility;changedFields:string[];reason:string;updates:Record<string,TowerScalar>}
export interface TowerAssignmentImpact{towerKey:string;towerId:string;changedTowerFields:string[];synchronizableFields:string[];relatedCount:number;eligibleCount:number;historicalCount:number;blockedCount:number;updatedCount:number;overflow:boolean;impactToken:string;assignments:TowerAssignmentImpactRow[]}
export type TowerAssignmentImpactPreview=Omit<TowerAssignmentImpact,"assignments">&{assignments:Omit<TowerAssignmentImpactRow,"updates">[]};
export const classifyAssignmentForTowerSync=runtime.classifyAssignmentForTowerSync as(record:RawAssignmentRecord)=>{eligibility:AssignmentSyncEligibility;reason:string};
export const assignmentTowerSyncUpdates=runtime.assignmentTowerSyncUpdates as(record:RawAssignmentRecord,nextTower:RawTowerRecord,changedFields:string[])=>Record<string,TowerScalar>;
export const analyzeTowerAssignmentImpact=runtime.analyzeTowerAssignmentImpact as(input:{towerKey:string;currentTower:RawTowerRecord;nextTower:RawTowerRecord;assignments:RawAssignmentSnapshotEntry[];overflow?:boolean})=>TowerAssignmentImpact;