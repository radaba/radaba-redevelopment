import type { RawAssignmentRecord, RawAssignmentRevisitEvent } from "./assignment-types";
import * as runtime from "./assignment-command-contract.mjs";

export const ASSIGNMENT_INITIAL_STATUS = runtime.ASSIGNMENT_INITIAL_STATUS as "Open";
export const ASSIGNMENT_INITIAL_STATE = runtime.ASSIGNMENT_INITIAL_STATE as "Open";
export const ASSIGNMENT_INITIAL_FTP_CHECK = runtime.ASSIGNMENT_INITIAL_FTP_CHECK as "Not Available";
export const ASSIGNMENT_REVISIT_STATUS = runtime.ASSIGNMENT_REVISIT_STATUS as "Open";
export const ASSIGNMENT_REVISIT_STATE = runtime.ASSIGNMENT_REVISIT_STATE as "On Progress";
export const ASSIGNMENT_TERMINAL_STATES = runtime.ASSIGNMENT_TERMINAL_STATES as readonly string[];
export const ASSIGNMENT_CREATED_COMPOSITE_FIELDS =
  runtime.ASSIGNMENT_CREATED_COMPOSITE_FIELDS as readonly string[];
export interface AssignmentCreateInput {
  towerKey: string;
  rnoKey: string;
  riggerKey: string;
  coordinatorKey: string;
  category: string;
  planDate?: string;
  description?: string;
}
export interface AssignmentRevisitActor {
  uid: string;
  name: string;
}
export interface AssignmentRevisitEvent extends RawAssignmentRevisitEvent {
  action: "Assignment Revisited";
  at: string;
  by_uid: string;
  by_name: string;
  reason: string;
  previous_status: string;
  new_status: "On Progress";
  previous_completed_at: string | null;
}
export interface AssignmentRiggerInput {
  assignmentId: string;
  riggerKey: string;
}
export interface AssignmentReference {
  key: string;
  name: string;
  secondary?: string | null;
}
export interface ResolvedAssignmentUser {
  key: string;
  uid: string | null;
  name: string;
  email: string;
  role: string;
  position: string;
  status: string;
  company: string | null;
}
export const jakartaParts = runtime.jakartaParts as (now?: Date) => {
  date: string;
  datetime: string;
  idDate: string;
};
export const buildAssignmentId = runtime.buildAssignmentId as (
  towerId: string,
  now?: Date,
) => string;
export const buildCreatedAssignmentComposites = runtime.buildCreatedAssignmentComposites as (
  record: RawAssignmentRecord,
) => Record<string, string>;
export const isCompletedAssignment = runtime.isCompletedAssignment as (
  record: Partial<
    Pick<
      RawAssignmentRecord,
      | "assignment_status"
      | "assignment_state"
      | "completed"
      | "completed_datetime"
      | "revisit_count"
    >
  >,
) => boolean;
export const buildRevisitedAssignment = runtime.buildRevisitedAssignment as (
  record: RawAssignmentRecord,
  eventKey: string,
  event: AssignmentRevisitEvent,
) => { record: RawAssignmentRecord; revisitCount: number };
export const buildRiggerDependentFields = runtime.buildRiggerDependentFields as (
  record: RawAssignmentRecord,
  rigger: { name: string; email: string },
) => Record<string, string>;
export const isRiggerAssignmentChange = runtime.isRiggerAssignmentChange as (
  record: Pick<RawAssignmentRecord, "rigger_email" | "rigger_name">,
  requestedRigger: { name?: unknown; email?: unknown } | null,
) => boolean;
export const isTerminalAssignment = runtime.isTerminalAssignment as (
  record: RawAssignmentRecord,
) => boolean;
