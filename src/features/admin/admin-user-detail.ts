import type { AdminPrivilegeRecord } from "./admin-types";
import * as runtime from "./admin-user-detail.mjs";
export interface AdminUserDetailRecord {
  key: string;
  malformed: boolean;
  uid: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  company: string | null;
  department: string | null;
  region: string | null;
  subRegion: string | null;
  phone: string | null;
  position: string | null;
  officeLocation: string | null;
  type: string | null;
  emailPartner: string | null;
  emailHuawei: string | null;
  employeeIdentifier: string | null;
  matelineId: string | null;
  joinDate: string | null;
  createDate: string | null;
  levelPo: string | null;
  supervisorL1: string | null;
  supervisorL2: string | null;
  supervisorL3: string | null;
  uniportalAccount: string | null;
  wahRigger: string | null;
  samOws: string | null;
  disabled: boolean | null;
}
export interface AdminUserPrivilegeView {
  key: string;
  pageName: string | null;
  path: string | null;
  category: string | null;
  parent: string | null;
  enabled: boolean | null;
}
export type AdminAuthMetadataState = "available" | "no_uid" | "not_found" | "unavailable";
export interface AdminAuthMetadata {
  state: AdminAuthMetadataState;
  uid: string | null;
  email: string | null;
  emailVerified: boolean | null;
  disabled: boolean | null;
  creationTime: string | null;
  lastSignInTime: string | null;
  providers: string[];
}
export interface AdminUserDetailDto {
  user: AdminUserDetailRecord;
  auth: AdminAuthMetadata;
  privileges: AdminUserPrivilegeView[];
  privilegeContract: "mapped" | "user_only_role" | "unknown_role";
  mappedPrivilegeKey: string | null;
  roleContractState: "assignable" | "legacy" | "privilege_only" | "unsupported" | "unknown";
  warnings: string[];
  currentAdministrator: boolean;
  identityMatch: "uid" | "email" | "none";
  finalAdministratorProtectionAppliesAtWrite: boolean;
}
export const validAdminUserKey = runtime.validAdminUserKey as (value: string) => boolean;
export const buildAdminUserDetail = runtime.buildAdminUserDetail as (
  user: AdminUserDetailRecord,
  privileges: AdminPrivilegeRecord[],
  actor: { uid?: unknown; email?: unknown },
) => Omit<AdminUserDetailDto, "auth">;
export const usableFirebaseUid = runtime.usableFirebaseUid as (value: unknown) => string | null;
export const emptyAdminAuthMetadata = runtime.emptyAdminAuthMetadata as (
  state: Exclude<AdminAuthMetadataState, "available">,
) => AdminAuthMetadata;
export const sanitizeAdminAuthRecord = runtime.sanitizeAdminAuthRecord as (
  record: unknown,
) => AdminAuthMetadata;
export const authMismatchWarnings = runtime.authMismatchWarnings as (
  user: AdminUserDetailRecord,
  auth: AdminAuthMetadata,
) => string[];
