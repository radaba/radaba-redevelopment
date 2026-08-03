export const ADMINISTRATOR_ROLE_DEFINITIONS = Object.freeze([
  {
    id: "field_team",
    label: "Field Team",
    assignable: true,
    privilegeKey: "field_team",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "l0_rno",
    label: "L0 RNO",
    assignable: true,
    privilegeKey: "l0_rno",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "l1_rno",
    label: "L1 RNO",
    assignable: true,
    privilegeKey: "l1_rno",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "l2_rno",
    label: "L2 RNO",
    assignable: true,
    privilegeKey: "l2_rno",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "manager",
    label: "Manager",
    assignable: true,
    privilegeKey: "manager",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "project_admin",
    label: "Project Admin",
    assignable: true,
    privilegeKey: "project_admin",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "super_admin",
    label: "Super Admin",
    assignable: true,
    privilegeKey: "super_admin",
    legacy: false,
    privilegeOnly: false,
  },
  {
    id: "project manager",
    label: "Project Manager (legacy)",
    assignable: false,
    privilegeKey: null,
    legacy: true,
    privilegeOnly: false,
  },
  {
    id: "project_owner",
    label: "Project Owner (privilege only)",
    assignable: false,
    privilegeKey: "project_owner",
    legacy: false,
    privilegeOnly: true,
  },
  {
    id: "web_admin",
    label: "Web Admin (privilege only)",
    assignable: false,
    privilegeKey: "web_admin",
    legacy: false,
    privilegeOnly: true,
  },
]);
const byId = new Map(
  ADMINISTRATOR_ROLE_DEFINITIONS.map((definition) => [definition.id, definition]),
);
export const administratorAssignableRoles = () =>
  ADMINISTRATOR_ROLE_DEFINITIONS.filter((definition) => definition.assignable);
export const administratorAssignableRoleIds = () =>
  administratorAssignableRoles().map((definition) => definition.id);
export const administratorRoleDefinition = (value) =>
  byId.get(typeof value === "string" ? value : "") ?? null;
export const administratorRoleLabel = (value) =>
  administratorRoleDefinition(value)?.label ?? `Unknown role (${String(value ?? "") || "missing"})`;
export function administratorRoleWriteError(value) {
  if (typeof value !== "string" || !value.trim()) return "Role is required.";
  const definition = administratorRoleDefinition(value);
  if (!definition) return "Role is unknown and cannot be assigned.";
  if (definition.legacy) return "This legacy role is read-only and cannot be assigned.";
  if (definition.privilegeOnly) return "This privilege-only role cannot be assigned to users.";
  return definition.assignable ? null : "Role is not assignable.";
}
export function administratorRoleContractState(value) {
  const definition = administratorRoleDefinition(value);
  return !definition
    ? "unknown"
    : definition.legacy
      ? "legacy"
      : definition.privilegeOnly
        ? "privilege_only"
        : definition.assignable
          ? "assignable"
          : "unsupported";
}
