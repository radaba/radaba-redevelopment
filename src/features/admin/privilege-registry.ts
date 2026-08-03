import {
  CANONICAL_PRIVILEGES as runtimeCanonicalPrivileges,
  canonicalPrivilegeById as runtimeCanonicalPrivilegeById,
  classifyPersistedPrivilegeRecords as runtimeClassifyPersistedPrivilegeRecords,
  compatibilityPrivilegeIdsForPath as runtimeCompatibilityPrivilegeIdsForPath,
  duplicatePersistedPrivilegePaths as runtimeDuplicatePersistedPrivilegePaths,
} from "./privilege-registry.mjs";

export type PrivilegeSection = "operations" | "administration";

export type CanonicalPrivilegeId =
  | "assignment"
  | "assignment_dashboard"
  | "towers"
  | "cells"
  | "aor_reports"
  | "riggers"
  | "users"
  | "roles"
  | "privileges"
  | "audit_center"
  | "assignment_maintenance";

export interface PrivilegeDefinition {
  id: CanonicalPrivilegeId;
  persistedPath: string;
  label: string;
  description: string;
  section: PrivilegeSection;
  navigationRoute: string;
  legacyAliases: readonly string[];
  systemProtected: boolean;
  order: number;
}

export interface PersistedPrivilegeCandidate {
  key?: unknown;
  path?: unknown;
  [field: string]: unknown;
}

export type PersistedPrivilegeClassification =
  | "current"
  | "duplicate"
  | "compatibility_record"
  | "unsupported"
  | "malformed";

export interface ClassifiedPersistedPrivilege<T extends PersistedPrivilegeCandidate> {
  record: T;
  classification: PersistedPrivilegeClassification;
  canonicalIds: CanonicalPrivilegeId[];
  reason: string;
}

export const CANONICAL_PRIVILEGES =
  runtimeCanonicalPrivileges as readonly PrivilegeDefinition[];

export function canonicalPrivilegeById(id: CanonicalPrivilegeId): PrivilegeDefinition | null {
  return runtimeCanonicalPrivilegeById(id) as PrivilegeDefinition | null;
}

export function compatibilityPrivilegeIdsForPath(path: string): CanonicalPrivilegeId[] {
  return runtimeCompatibilityPrivilegeIdsForPath(path) as CanonicalPrivilegeId[];
}

export function duplicatePersistedPrivilegePaths(records: readonly PersistedPrivilegeCandidate[]) {
  return runtimeDuplicatePersistedPrivilegePaths(records) as Array<{ path: string; keys: string[] }>;
}

export function classifyPersistedPrivilegeRecords<T extends PersistedPrivilegeCandidate>(
  records: readonly T[],
): ClassifiedPersistedPrivilege<T>[] {
  return runtimeClassifyPersistedPrivilegeRecords(records) as ClassifiedPersistedPrivilege<T>[];
}
