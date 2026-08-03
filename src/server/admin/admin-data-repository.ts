import type {
  AdminPrivilegeRecord,
  AdminRoleSummary,
  AdminUserRecord,
  AdminUserStatus,
} from "@/features/admin/admin-types";

export interface AdminDataReadRepository {
  listUsers(): Promise<AdminUserRecord[]>;
  listPrivileges(): Promise<AdminPrivilegeRecord[]>;
  listRoles(): Promise<AdminRoleSummary[]>;
}

export interface AdminCommandRepository extends AdminDataReadRepository {
  findUser(userKey: string): Promise<AdminUserRecord | null>;
  findPrivilege(privilegeKey: string): Promise<AdminPrivilegeRecord | null>;
  supportedRoles(): Promise<string[]>;
  countActiveAdministrators(): Promise<number>;
  updateUserRoleField(userKey: string, role: string): Promise<void>;
  updateUserStatusField(userKey: string, status: AdminUserStatus): Promise<void>;
  updatePrivilegeRoleField(privilegeKey: string, role: string, enabled: boolean): Promise<void>;
}
