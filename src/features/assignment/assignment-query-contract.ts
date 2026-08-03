import {
  ASSIGNMENT_COMPOSITE_FIELDS as runtimeCompositeFields,
  ASSIGNMENT_TIME_FIELDS as runtimeTimeFields,
  buildAssignmentCompositeRange,
  buildAssignmentDateRange,
  getAssignmentQueryField,
} from "./assignment-query-contract.mjs";

export type AssignmentTimeBasis = "onCreate" | "onFinish";
export type AssignmentFilterCategory = "status" | "rigger_name" | "region" | "sub_region" | "company";
export type AssignmentSearchType = "assignmentId" | "towerId";

export interface AssignmentListQueryInput {
  timeBasis: AssignmentTimeBasis;
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
  filterCategory?: AssignmentFilterCategory;
  filterValues?: readonly string[];
  searchType?: AssignmentSearchType;
  searchValue?: string;
  slaState?: import("./assignment-sla-contract").AssignmentSlaState;
  agingBucket?: import("./assignment-sla-contract").AssignmentAgingBucket;
}

export const ASSIGNMENT_TIME_FIELDS = runtimeTimeFields as Readonly<Record<AssignmentTimeBasis, "created_date" | "closed_date">>;
export const ASSIGNMENT_COMPOSITE_FIELDS = runtimeCompositeFields as Readonly<
  Record<AssignmentTimeBasis, Readonly<Record<AssignmentFilterCategory, string>>>
>;

export { buildAssignmentCompositeRange, buildAssignmentDateRange, getAssignmentQueryField };
