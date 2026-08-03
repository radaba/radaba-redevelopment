export interface AdminUserRecord {
  key: string;
  uid: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  company: string | null;
  region: string | null;
  photoUrl: string | null;
  photoUpdatedAt: string | null;
}

export interface AdminPrivilegeRecord {
  key: string;
  privilege_id: string | null;
  page_name: string | null;
  path: string | null;
  category: string | null;
  parent: string | null;
  roleValues: Record<string, boolean>;
}

export interface AdminRoleSummary {
  role: string;
  userCount: number;
  enabledPageCount: number;
  isAdministrator: boolean;
  hasPrivilegeField: boolean;
}

export const ADMIN_USER_STATUSES = ["Active", "Not Active"] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];
