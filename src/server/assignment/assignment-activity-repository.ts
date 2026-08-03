import type {RawAssignmentRecord} from "@/features/assignment/assignment-types";
export interface AssignmentActivitySources{assignmentKey:string;assignment:RawAssignmentRecord;audits:Record<string,unknown>;cells:unknown[];images:unknown[];photos:unknown[];unavailableSources:string[];bounded:true}
export interface AssignmentActivityRepository{read(assignmentKey:string,assignment:RawAssignmentRecord):Promise<AssignmentActivitySources>}
