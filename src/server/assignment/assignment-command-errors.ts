export type AssignmentCommandErrorCode =
  | "ASSIGNMENT_COMPLETED"
  | "ASSIGNMENT_NOT_COMPLETED"
  | "ASSIGNMENT_INVALID_TRANSITION"
  | "assignment-conflict"
  | "assignment-not-found"
  | "tower-not-found"
  | "rno-not-found"
  | "rigger-not-found"
  | "coordinator-not-found"
  | "category-not-found"
  | "invalid-input"
  | "permission-denied"
  | "stale-record"
  | "import-file-too-large"
  | "import-validation-failed"
  | "photo-file-too-large"
  | "photo-limit-reached"
  | "photo-not-found"
  | "invalid_assignment_key"
  | "assignment_changed"
  | "assignment_identity_mismatch"
  | "duplicate_assignment_id"
  | "ambiguous_rigger"
  | "dependent_update_failed"
  | "audit_failed"
  | "transaction_conflict";
const statuses: Record<AssignmentCommandErrorCode, number> = {
  ASSIGNMENT_COMPLETED: 409,
  ASSIGNMENT_NOT_COMPLETED: 409,
  ASSIGNMENT_INVALID_TRANSITION: 409,
  "invalid-input": 400,
  "permission-denied": 403,
  "assignment-not-found": 404,
  "tower-not-found": 404,
  "rno-not-found": 404,
  "rigger-not-found": 404,
  "coordinator-not-found": 404,
  "category-not-found": 404,
  "assignment-conflict": 409,
  "stale-record": 409,
  "import-file-too-large": 413,
  "import-validation-failed": 422,
  "photo-file-too-large": 413,
  "photo-limit-reached": 409,
  "photo-not-found": 404,
  invalid_assignment_key: 400,
  assignment_changed: 409,
  assignment_identity_mismatch: 409,
  duplicate_assignment_id: 409,
  ambiguous_rigger: 409,
  dependent_update_failed: 500,
  audit_failed: 500,
  transaction_conflict: 409,
};
export class AssignmentCommandError extends Error {
  constructor(
    public readonly code: AssignmentCommandErrorCode,
    message: string,
  ) {
    super(message);
  }
  get status() {
    return statuses[this.code];
  }
}
