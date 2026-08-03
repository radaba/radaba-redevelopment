import * as runtime from "./administrator-role-contract.mjs";
export interface AdministratorRoleDefinition {
  id: string;
  label: string;
  assignable: boolean;
  privilegeKey: string | null;
  legacy: boolean;
  privilegeOnly: boolean;
}
export type AdministratorRoleContractState =
  "assignable" | "legacy" | "privilege_only" | "unsupported" | "unknown";
export const ADMINISTRATOR_ROLE_DEFINITIONS =
  runtime.ADMINISTRATOR_ROLE_DEFINITIONS as readonly AdministratorRoleDefinition[];
export const administratorAssignableRoles =
  runtime.administratorAssignableRoles as () => AdministratorRoleDefinition[];
export const administratorAssignableRoleIds =
  runtime.administratorAssignableRoleIds as () => string[];
export const administratorRoleDefinition = runtime.administratorRoleDefinition as (
  value: unknown,
) => AdministratorRoleDefinition | null;
export const administratorRoleLabel = runtime.administratorRoleLabel as (value: unknown) => string;
export const administratorRoleWriteError = runtime.administratorRoleWriteError as (
  value: unknown,
) => string | null;
export const administratorRoleContractState = runtime.administratorRoleContractState as (
  value: unknown,
) => AdministratorRoleContractState;
