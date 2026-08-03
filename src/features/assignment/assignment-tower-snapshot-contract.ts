import * as runtime from "./assignment-tower-snapshot-contract.mjs";
export const ASSIGNMENT_TOWER_SNAPSHOT_FIELDS=runtime.ASSIGNMENT_TOWER_SNAPSHOT_FIELDS as readonly string[];
export const ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT=runtime.ASSIGNMENT_SNAPSHOT_PREVIEW_LIMIT as number;
export const ASSIGNMENT_SNAPSHOT_COMMIT_LIMIT=runtime.ASSIGNMENT_SNAPSHOT_COMMIT_LIMIT as number;
export const ASSIGNMENT_SNAPSHOT_CONFIRMATION=runtime.ASSIGNMENT_SNAPSHOT_CONFIRMATION as string;
export const assignmentSnapshotFieldLabel=runtime.assignmentSnapshotFieldLabel as(field:string)=>string;
export const missingAssignmentSnapshotFields=runtime.missingAssignmentSnapshotFields as(record:Record<string,unknown>)=>string[];
export const availableSnapshotBackfill=runtime.availableSnapshotBackfill as(record:Record<string,unknown>,tower:Record<string,unknown>)=>Record<string,string|number|boolean>;
export const classifySnapshotAssignment=runtime.classifySnapshotAssignment as(record:Record<string,unknown>)=>"eligible"|"historical"|"blocked";
export interface AssignmentSnapshotBackfillRow{assignmentKey:string;assignmentId:string;towerKey:string|null;towerId:string;status:string;classification:string;sourceClassification?:"image_single_match"|"image_duplicate_identical";missingFields:string[];repairedFields?:string[];reason:string;result?:string;message?:string}
export interface AssignmentSnapshotBackfillResult{scannedCount:number;repairableActiveCount:number;historicalCount:number;alreadyCompleteCount:number;missingTowerCount:number;ambiguousCount:number;blockedCount:number;fieldCounts:Record<string,number>;rows:AssignmentSnapshotBackfillRow[];bounded:boolean}
export const assignmentSnapshotResultCsv=runtime.assignmentSnapshotResultCsv as(rows:AssignmentSnapshotBackfillRow[])=>string;
