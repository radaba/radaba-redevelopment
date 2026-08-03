import type { RawAssignmentRecord } from "./assignment-types";
import * as runtime from "./assignment-sla-contract.mjs";

export type AssignmentSlaState =
  | "On Track" | "Warning" | "Overdue" | "Escalated" | "Not Applicable" | "Unavailable";
export type AssignmentAgingBucket = "0-1" | "2-3" | "4-7" | "8-14" | "15+";
export interface AssignmentSlaEvaluation {
  state: AssignmentSlaState;
  status: string;
  targetMs: number | null;
  stateStartedAtMs: number | null;
  statusAgeMs: number | null;
  assignmentAgeMs: number | null;
  workingDurationMs: number | null;
  pauseDurationMs: number | null;
  lastActivityAtMs: number | null;
  timeSinceLastActivityMs: number | null;
  remainingMs: number | null;
  overdueMs: number;
  escalationReasons: string[];
  agingBucket: AssignmentAgingBucket | null;
  limitations: string[];
}
export const ASSIGNMENT_SLA_CONFIG = runtime.ASSIGNMENT_SLA_CONFIG as Readonly<{
  targetMsByStatus: Readonly<Record<string, number>>;
  warningRatio: number;
  escalationOverdueMs: number;
  escalationPausedMs: number;
  escalationRevisitCount: number;
}>;
export const assignmentSlaTimestamp = runtime.assignmentSlaTimestamp as (value: unknown) => number | null;
export const assignmentAgingBucket = runtime.assignmentAgingBucket as (ageMs: number | null) => AssignmentAgingBucket | null;
export const evaluateAssignmentSla = runtime.evaluateAssignmentSla as (
  record: RawAssignmentRecord, now?: Date,
) => AssignmentSlaEvaluation;
export const matchesAssignmentSlaFilters = runtime.matchesAssignmentSlaFilters as (
  record: RawAssignmentRecord,
  filters: { slaState?: AssignmentSlaState; agingBucket?: AssignmentAgingBucket },
  now?: Date,
) => boolean;
