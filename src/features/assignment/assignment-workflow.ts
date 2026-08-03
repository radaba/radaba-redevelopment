import type { RawAssignmentRecord } from "./assignment-types";
import * as runtime from "./assignment-workflow.mjs";

export type AssignmentState =
  "Open" | "Accepted" | "On Progress" | "Paused" | "Finished" | "Rejected" | "Dropped";

export type AssignmentTransitionAction = "accept" | "start" | "resume" | "complete" | "pause";

export const ASSIGNMENT_STATES = runtime.ASSIGNMENT_STATES as readonly AssignmentState[];
export const ASSIGNMENT_TRANSITIONS = runtime.ASSIGNMENT_TRANSITIONS as Readonly<
  Record<
    AssignmentTransitionAction,
    {
      from: readonly AssignmentState[];
      to: AssignmentState;
      dateField?: string;
      datetimeField?: string;
    }
  >
>;

export const normalizeAssignmentState = runtime.normalizeAssignmentState as (
  value: unknown,
) => AssignmentState | null;

export const availableAssignmentTransitions = runtime.availableAssignmentTransitions as (
  record: Pick<RawAssignmentRecord, "assignment_state">,
) => AssignmentTransitionAction[];

export const buildAssignmentTransition = runtime.buildAssignmentTransition as (
  record: RawAssignmentRecord,
  action: AssignmentTransitionAction,
  timestamp: { date: string; datetime: string },
  actor?: { uid: string; name: string },
) => Record<string, string | boolean> | null;
