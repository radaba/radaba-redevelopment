export const PRIVILEGE_SECTIONS = Object.freeze({
  operations: "operations",
  administration: "administration",
});

const definition = (value) => Object.freeze({ ...value, legacyAliases: Object.freeze(value.legacyAliases) });

export const CANONICAL_PRIVILEGES = Object.freeze([
  definition({ id: "assignment", persistedPath: "/assignment", label: "Assignment", description: "Access Assignment operations.", section: "operations", navigationRoute: "/home/assignment", legacyAliases: [], systemProtected: false, order: 1 }),
  definition({ id: "assignment_dashboard", persistedPath: "/assignment/dashboard", label: "Dashboard", description: "View Assignment analytics.", section: "operations", navigationRoute: "/home/assignment/dashboard", legacyAliases: ["/assignment"], systemProtected: false, order: 2 }),
  definition({ id: "towers", persistedPath: "/towers", label: "Towers", description: "Access Tower operations.", section: "operations", navigationRoute: "/home/towers", legacyAliases: ["/assignment", "/towerdatabase"], systemProtected: false, order: 3 }),
  definition({ id: "cells", persistedPath: "/cells", label: "Cells", description: "Access Cell operations.", section: "operations", navigationRoute: "/home/cells", legacyAliases: ["/assignment", "/rcell"], systemProtected: false, order: 4 }),
  definition({ id: "aor_reports", persistedPath: "/reports", label: "AOR Reports", description: "Access AOR reports.", section: "operations", navigationRoute: "/home/reports", legacyAliases: ["/assignment", "/antennareport"], systemProtected: false, order: 5 }),
  definition({ id: "riggers", persistedPath: "/riggers", label: "Riggers", description: "Access the Rigger directory.", section: "operations", navigationRoute: "/home/riggers", legacyAliases: ["/assignment"], systemProtected: false, order: 6 }),
  definition({ id: "users", persistedPath: "/users", label: "Users", description: "Administer user accounts.", section: "administration", navigationRoute: "/home/admin/users", legacyAliases: [], systemProtected: true, order: 7 }),
  definition({ id: "roles", persistedPath: "/roles", label: "Roles", description: "Administer role assignments.", section: "administration", navigationRoute: "/home/admin/roles", legacyAliases: [], systemProtected: true, order: 8 }),
  definition({ id: "privileges", persistedPath: "/privilege", label: "Privileges", description: "Administer privilege assignments.", section: "administration", navigationRoute: "/home/admin/privileges", legacyAliases: [], systemProtected: true, order: 9 }),
  definition({ id: "audit_center", persistedPath: "/audit", label: "Audit Center", description: "Review administrator audit records.", section: "administration", navigationRoute: "/home/admin/audit", legacyAliases: [], systemProtected: true, order: 10 }),
  definition({ id: "assignment_maintenance", persistedPath: "/assignment-maintenance", label: "Assignment Maintenance", description: "Maintain Assignment snapshots.", section: "administration", navigationRoute: "/home/admin/assignment-maintenance", legacyAliases: [], systemProtected: true, order: 11 }),
]);

const exactByPath = new Map(CANONICAL_PRIVILEGES.map((item) => [item.persistedPath, item]));

export function canonicalPrivilegeById(id) {
  return CANONICAL_PRIVILEGES.find((item) => item.id === id) ?? null;
}

export function compatibilityPrivilegeIdsForPath(path) {
  if (typeof path !== "string" || !path) return [];
  return CANONICAL_PRIVILEGES
    .filter((item) => item.persistedPath === path || item.legacyAliases.includes(path))
    .map((item) => item.id);
}

export function duplicatePersistedPrivilegePaths(records) {
  const keysByPath = new Map();
  for (const record of records) {
    if (typeof record?.path !== "string" || !record.path) continue;
    const keys = keysByPath.get(record.path) ?? [];
    keys.push(String(record.key ?? ""));
    keysByPath.set(record.path, keys);
  }
  return [...keysByPath.entries()]
    .filter(([, keys]) => keys.length > 1)
    .map(([path, keys]) => ({ path, keys }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function classifyPersistedPrivilegeRecords(records) {
  const duplicatePaths = new Set(duplicatePersistedPrivilegePaths(records).map((item) => item.path));
  return records.map((record) => {
    const path = typeof record?.path === "string" ? record.path : "";
    const exact = exactByPath.get(path);
    if (!record || typeof record !== "object" || !record.key || !path) {
      return { record, classification: "malformed", canonicalIds: [], reason: "Missing persisted key or path." };
    }
    if (exact) {
      return {
        record,
        classification: duplicatePaths.has(path) ? "duplicate" : "current",
        canonicalIds: [exact.id],
        reason: duplicatePaths.has(path) ? "Multiple persisted records use this canonical path." : "Matches a canonical persisted path.",
      };
    }
    const aliases = compatibilityPrivilegeIdsForPath(path);
    if (aliases.length) {
      return { record, classification: "compatibility_record", canonicalIds: aliases, reason: "Matches an explicit legacy compatibility alias." };
    }
    return { record, classification: "unsupported", canonicalIds: [], reason: "No canonical privilege or approved compatibility alias uses this path." };
  });
}
