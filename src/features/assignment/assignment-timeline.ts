import type {RawAssignmentRecord} from "./assignment-types";
import * as runtime from "./assignment-timeline.mjs";
export type AssignmentTimelineCategory="status"|"rigger"|"cell"|"images"|"reports"|"administration";
export interface AssignmentTimelineEvent{eventKey:string;source:string;sourceKey:string;type:string;label:string;timestamp:string|number;epochMs:number|null;validTimestamp:boolean;category:AssignmentTimelineCategory;actorName:string|null;actorEmail:string|null;description:string;changedFields:string[];metadata:Record<string,unknown>;inferred:boolean;severity:"info"|"warning"|"critical";relatedHref?:string|null}
export interface AssignmentActivityInput{assignmentKey:string;assignment:RawAssignmentRecord;audits?:Record<string,unknown>;cells?:unknown[];images?:unknown[];photos?:unknown[]}
export const ASSIGNMENT_TIMELINE_FILTERS=runtime.ASSIGNMENT_TIMELINE_FILTERS as readonly string[];
export const buildAssignmentActivityTimeline=runtime.buildAssignmentActivityTimeline as (input:AssignmentActivityInput)=>AssignmentTimelineEvent[];
export const filterAssignmentTimeline=runtime.filterAssignmentTimeline as (events:readonly AssignmentTimelineEvent[],filter:string)=>AssignmentTimelineEvent[];
export const assignmentTimelineDateLabel=runtime.assignmentTimelineDateLabel as (value:unknown,now?:Date)=>string;
export const formatAssignmentTimelineTimestamp=runtime.formatAssignmentTimelineTimestamp as (value:unknown)=>string;
export const assignmentTimelineEventLabel=runtime.assignmentTimelineEventLabel as (value:string)=>string;
export const buildAssignmentTimeline=runtime.buildAssignmentTimeline;
