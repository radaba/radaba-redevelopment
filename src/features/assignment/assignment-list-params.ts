import type { AssignmentListQueryInput } from "./assignment-query-contract";
import {
  defaultAssignmentDates as runtimeDefaultAssignmentDates,
  parseAssignmentListParams as runtimeParseAssignmentListParams,
} from "./assignment-list-params.mjs";

export type AssignmentSearchParams = Record<string, string | string[] | undefined>;

export function defaultAssignmentDates(now = new Date()) {
  return runtimeDefaultAssignmentDates(now) as { startDate: string; endDate: string };
}

export function parseAssignmentListParams(
  input: AssignmentSearchParams,
  now = new Date(),
): AssignmentListQueryInput {
  return runtimeParseAssignmentListParams(input, now) as AssignmentListQueryInput;
}

