import type { AssignmentListItem, RawAssignmentRecord } from "./assignment-types";
import { mapRawAssignmentToListItem as mapRuntime } from "./assignment-mapper.mjs";

/**
 * Produces a list-only view without mutating or writing the raw RTDB record.
 * Missing values become null. Text-like scalar values are preserved as text;
 * image_total intentionally retains its legacy string-or-number representation.
 * Duration is not calculated because the legacy 39-minute rule is unresolved.
 */
export function mapRawAssignmentToListItem(
  key: string,
  raw: RawAssignmentRecord,
): AssignmentListItem {
  return mapRuntime(key, raw) as AssignmentListItem;
}
