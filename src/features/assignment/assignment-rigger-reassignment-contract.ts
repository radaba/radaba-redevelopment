import * as runtime from "./assignment-rigger-reassignment-contract.mjs";
export const ASSIGNMENT_RIGGER_BASELINE_FIELDS =
  runtime.ASSIGNMENT_RIGGER_BASELINE_FIELDS as readonly string[];
export const isAssignmentFirebasePushKey = runtime.isAssignmentFirebasePushKey as (
  value: unknown,
) => boolean;
export const assignmentRiggerBaseline = runtime.assignmentRiggerBaseline as (
  record: object,
) => Record<string, string | number | boolean | null>;
export const changedAssignmentRiggerBaselineFields =
  runtime.changedAssignmentRiggerBaselineFields as (
    record: object,
    expected: Record<string, unknown>,
  ) => string[];
export const sameAssignmentRiggerBaseline = runtime.sameAssignmentRiggerBaseline as (
  record: object,
  expected: Record<string, unknown>,
) => boolean;
