import type { AssignmentListItem } from "./assignment-types";
import {
  ASSIGNMENT_CSV_HEADINGS,
  ASSIGNMENT_CSV_USES_BOM,
  ASSIGNMENT_EXPORT_MAX_ROWS,
  assignmentCsvFilename,
  escapeCsvCell,
  serializeAssignmentCsv as runtimeSerialize,
} from "./assignment-csv-contract.mjs";

export {
  ASSIGNMENT_CSV_HEADINGS,
  ASSIGNMENT_CSV_USES_BOM,
  ASSIGNMENT_EXPORT_MAX_ROWS,
  assignmentCsvFilename,
  escapeCsvCell,
};

export function serializeAssignmentCsv(rows: readonly AssignmentListItem[]): string {
  return runtimeSerialize(rows);
}
