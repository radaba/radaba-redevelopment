import {
  ASSIGNMENT_SEARCH_FIELDS as runtimeFields,
  buildTowerSearchRange,
  getAssignmentSearchField,
} from "./assignment-search-contract.mjs";
import type { AssignmentSearchType, AssignmentTimeBasis } from "./assignment-query-contract";

export const ASSIGNMENT_SEARCH_FIELDS = runtimeFields as {
  readonly assignmentId: "assignment_id";
  readonly towerId: {
    readonly onCreate: "index_created_date_tower_id";
    readonly onFinish: "index_closed_date_tower_id";
  };
};

export function assignmentSearchField(searchType: AssignmentSearchType, timeBasis: AssignmentTimeBasis) {
  return getAssignmentSearchField(searchType, timeBasis) as string;
}

export { buildTowerSearchRange };
