import * as runtime from "./assignment-execution-contract.mjs";
import type { RawAssignmentChecklist, RawAssignmentRecord, RawAssignmentWorkReport } from "./assignment-types";
export type AssignmentChecklistStatus = "pending" | "completed" | "not_applicable";
export interface AssignmentChecklistItem { id:string; label:string; status:AssignmentChecklistStatus; note:string; custom:boolean; updatedAt:string|null; updatedByName:string|null }
export interface AssignmentChecklist { revision:number; updatedAt:string|null; updatedByName:string|null; items:AssignmentChecklistItem[] }
export interface AssignmentMaterial { id:string; name:string; quantity:number; unit:string; note:string }
export interface AssignmentWorkReport { revision:number; findings:string; actionsPerformed:string; technicalResult:string; completionNotes:string; recommendations:string; materials:AssignmentMaterial[]; updatedAt:string|null; updatedByName:string|null }
export interface AssignmentExecutionActor { uid:string; name:string; email:string; role:string }
export interface AssignmentChecklistUpdate { expectedRevision:number; items:Array<{id:string;label?:string;status:AssignmentChecklistStatus;note?:string}> }
export interface AssignmentWorkReportUpdate { expectedRevision:number; findings:string; actionsPerformed:string; technicalResult:string; completionNotes:string; recommendations:string; materials:AssignmentMaterial[] }
export const ASSIGNMENT_CHECKLIST_STATUSES=runtime.ASSIGNMENT_CHECKLIST_STATUSES as readonly AssignmentChecklistStatus[];
export const ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS=runtime.ASSIGNMENT_DEFAULT_CHECKLIST_ITEMS as readonly {id:string;label:string}[];
export const ASSIGNMENT_EXECUTION_LIMITS=runtime.ASSIGNMENT_EXECUTION_LIMITS as Record<string,number>;
export const isAssignmentChecklistStatus=runtime.isAssignmentChecklistStatus as (value:unknown)=>value is AssignmentChecklistStatus;
export const canEditAssignmentExecution=runtime.canEditAssignmentExecution as (record:unknown,actor:AssignmentExecutionActor)=>boolean;
export const normalizeAssignmentChecklist=runtime.normalizeAssignmentChecklist as (value:unknown)=>AssignmentChecklist;
export const normalizeAssignmentWorkReport=runtime.normalizeAssignmentWorkReport as (value:unknown)=>AssignmentWorkReport;
export const buildAssignmentChecklist=runtime.buildAssignmentChecklist as (record:RawAssignmentRecord,input:AssignmentChecklistUpdate,actor:AssignmentExecutionActor,timestamp:string)=>RawAssignmentChecklist|null;
export const buildAssignmentWorkReport=runtime.buildAssignmentWorkReport as (record:RawAssignmentRecord,input:AssignmentWorkReportUpdate,actor:AssignmentExecutionActor,timestamp:string)=>RawAssignmentWorkReport|null;