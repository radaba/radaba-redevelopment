export const ASSIGNMENT_TIMEZONE = "Asia/Jakarta";
export const ASSIGNMENT_DISPLAY_DATE_FORMAT = "DD/MM/yyyy";
export const ASSIGNMENT_QUERY_DATE_FORMAT = "YYYY-MM-DD";
export const ASSIGNMENT_DEFAULT_LOOKBACK_DAYS = 8;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertAssignmentQueryDate(value: string): string {
  if (!DATE_PATTERN.test(value)) throw new Error("Assignment query dates must use YYYY-MM-DD.");
  return value;
}
