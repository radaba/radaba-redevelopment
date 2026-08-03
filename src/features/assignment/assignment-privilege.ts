import "server-only";

import { canAccessAssignment as runtimeCanAccessAssignment } from "./assignment-privilege.mjs";

export interface AssignmentPrivilegeRecord {
  path?: unknown;
  [property: string]: unknown;
}

export function canAccessAssignment(
  privileges: readonly AssignmentPrivilegeRecord[] | Record<string, AssignmentPrivilegeRecord> | null | undefined,
  role: string,
): boolean {
  return runtimeCanAccessAssignment(privileges, role);
}
