import * as runtime from "./assignment-import-contract.mjs";
export const ASSIGNMENT_IMPORT_HEADINGS = runtime.ASSIGNMENT_IMPORT_HEADINGS as readonly string[];
export const ASSIGNMENT_IMPORT_SAMPLE_ROWS =
  runtime.ASSIGNMENT_IMPORT_SAMPLE_ROWS as readonly (readonly string[])[];
export const ASSIGNMENT_IMPORT_MAX_BYTES = runtime.ASSIGNMENT_IMPORT_MAX_BYTES as number;
export const ASSIGNMENT_IMPORT_MAX_ROWS = runtime.ASSIGNMENT_IMPORT_MAX_ROWS as number;
export const ASSIGNMENT_IMPORT_FILENAME = runtime.ASSIGNMENT_IMPORT_FILENAME as string;
export const ASSIGNMENT_IMPORT_MIME_TYPES =
  runtime.ASSIGNMENT_IMPORT_MIME_TYPES as readonly string[];
export const AssignmentCsvError = runtime.AssignmentCsvError as typeof runtime.AssignmentCsvError;
export interface AssignmentImportRow {
  rowNumber: number;
  tower_id: string;
  rno: string;
  rigger: string;
  coordinator: string;
  category: string;
  plan_date: string;
  description: string;
}
export interface AssignmentImportFieldError {
  code: string;
  field: string;
  message: string;
}
export interface AssignmentImportRowResult {
  rowNumber: number;
  towerId: string;
  status: "valid" | "invalid" | "warning" | "imported";
  normalized?: Record<string, string | null>;
  errors: AssignmentImportFieldError[];
  code?: string;
  field?: string;
  message?: string;
  resolved?: { tower: string; rno: string; rigger: string; coordinator: string; category: string };
}
export interface AssignmentImportValidation {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  canCommit: boolean;
  rows: AssignmentImportRowResult[];
}
export const parseAssignmentCsv = runtime.parseAssignmentCsv as (
  text: string,
) => AssignmentImportRow[];
export const assignmentImportTemplate = runtime.assignmentImportTemplate as () => string;
export const assignmentImportErrorReport = runtime.assignmentImportErrorReport as (
  rows: AssignmentImportRowResult[],
) => string;
