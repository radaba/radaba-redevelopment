import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { ADMINISTRATOR_ROLE } from "@/features/admin/admin-authorization";
import type {
  AdminPrivilegeRecord,
  AdminRoleSummary,
  AdminUserRecord,
  AdminUserStatus,
} from "@/features/admin/admin-types";
import type { AdminCommandRepository } from "./admin-data-repository";
import type { AdminUserDetailRecord } from "@/features/admin/admin-user-detail";

const USER_PATH = "user";
const PRIVILEGE_PATH = "privilege";
const PRIVILEGE_METADATA_FIELDS = new Set([
  "category",
  "icon",
  "page_name",
  "parent",
  "path",
  "privilege_id",
]);

export function supportedRolesFromRecords(
  users: AdminUserRecord[],
  privileges: AdminPrivilegeRecord[],
): string[] {
  return [
    ...new Set([
      ...users.map((user) => user.role).filter((role): role is string => Boolean(role)),
      ...privileges.flatMap((record) => Object.keys(record.roleValues)),
    ]),
  ].sort();
}

function text(value: unknown): string | null {
  return typeof value === "string"
    ? value
    : value === null || value === undefined
      ? null
      : String(value);
}

function userFromSnapshot(snapshot: DataSnapshot): AdminUserRecord {
  const value = (snapshot.val() ?? {}) as Record<string, unknown>;
  return {
    key: snapshot.key ?? "",
    uid: text(value.uid),
    name: text(value.name),
    email: text(value.email),
    role: text(value.role),
    status: text(value.status),
    company: text(value.company),
    region: text(value.region),
    photoUrl: text(value.photo_url),
    photoUpdatedAt: text(value.updated_at),
  };
}

function userDetailFromSnapshot(snapshot: DataSnapshot): AdminUserDetailRecord {
  const raw = snapshot.val(),
    malformed = typeof raw !== "object" || raw === null || Array.isArray(raw),
    value = malformed ? {} : (raw as Record<string, unknown>);
  const boolean = (field: string) =>
    typeof value[field] === "boolean" ? (value[field] as boolean) : null;
  return {
    key: snapshot.key ?? "",
    malformed,
    uid: text(value.uid),
    name: text(value.name),
    email: text(value.email),
    role: text(value.role),
    status: text(value.status),
    company: text(value.company),
    department: text(value.department),
    region: text(value.region),
    subRegion: text(value.sub_region),
    phone: text(value.phone),
    position: text(value.position),
    officeLocation: text(value.office_location),
    type: text(value.type),
    emailPartner: text(value.email_partner),
    emailHuawei: text(value.email_huawei),
    employeeIdentifier: text(value.ic_number),
    matelineId: text(value.mateline_id),
    joinDate: text(value.join_date),
    createDate: text(value.create_date),
    levelPo: text(value.level_po),
    supervisorL1: text(value.supervisor_l1),
    supervisorL2: text(value.supervisor_l2),
    supervisorL3: text(value.supervisor_l3),
    uniportalAccount: text(value.uniportal_account),
    wahRigger: text(value.wah_rigger),
    samOws: text(value.sam_ows),
    disabled: boolean("disabled"),
  };
}

function privilegeFromSnapshot(snapshot: DataSnapshot): AdminPrivilegeRecord {
  const value = (snapshot.val() ?? {}) as Record<string, unknown>;
  const roleValues = Object.fromEntries(
    Object.entries(value).filter(
      ([field, fieldValue]) =>
        !PRIVILEGE_METADATA_FIELDS.has(field) && typeof fieldValue === "boolean",
    ),
  ) as Record<string, boolean>;
  return {
    key: snapshot.key ?? "",
    privilege_id: text(value.privilege_id),
    page_name: text(value.page_name),
    path: text(value.path),
    category: text(value.category),
    parent: text(value.parent),
    roleValues,
  };
}

async function children(snapshotPromise: Promise<DataSnapshot>) {
  const snapshot = await snapshotPromise;
  const result: DataSnapshot[] = [];
  snapshot.forEach((child) => {
    result.push(child);
  });
  return result;
}

export class FirebaseAdminDataRepository implements AdminCommandRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async listUsers(): Promise<AdminUserRecord[]> {
    return (await children(this.database.ref(USER_PATH).once("value")))
      .map(userFromSnapshot)
      .sort((a, b) =>
        String(a.name ?? a.email ?? "").localeCompare(String(b.name ?? b.email ?? "")),
      );
  }

  async listPrivileges(): Promise<AdminPrivilegeRecord[]> {
    return (await children(this.database.ref(PRIVILEGE_PATH).once("value")))
      .map(privilegeFromSnapshot)
      .sort((a, b) =>
        `${a.category ?? ""}:${a.page_name ?? ""}`.localeCompare(
          `${b.category ?? ""}:${b.page_name ?? ""}`,
        ),
      );
  }

  async supportedRoles(): Promise<string[]> {
    const [users, privileges] = await Promise.all([this.listUsers(), this.listPrivileges()]);
    return supportedRolesFromRecords(users, privileges);
  }

  async listRoles(): Promise<AdminRoleSummary[]> {
    const [users, privileges, roles] = await Promise.all([
      this.listUsers(),
      this.listPrivileges(),
      this.supportedRoles(),
    ]);
    return roles.map((role) => ({
      role,
      userCount: users.filter((user) => user.role === role).length,
      enabledPageCount: privileges.filter((record) => record.roleValues[role] === true).length,
      isAdministrator: role === ADMINISTRATOR_ROLE,
      hasPrivilegeField: privileges.some((record) => Object.hasOwn(record.roleValues, role)),
    }));
  }

  async findUser(userKey: string): Promise<AdminUserRecord | null> {
    const snapshot = await this.database.ref(USER_PATH).child(userKey).once("value");
    return snapshot.exists() ? userFromSnapshot(snapshot) : null;
  }

  async findUserDetail(userKey: string): Promise<AdminUserDetailRecord | null> {
    const snapshot = await this.database.ref(USER_PATH).child(userKey).once("value");
    return snapshot.exists() ? userDetailFromSnapshot(snapshot) : null;
  }

  async findPrivilege(privilegeKey: string): Promise<AdminPrivilegeRecord | null> {
    const snapshot = await this.database.ref(PRIVILEGE_PATH).child(privilegeKey).once("value");
    return snapshot.exists() ? privilegeFromSnapshot(snapshot) : null;
  }

  async countActiveAdministrators(): Promise<number> {
    const users = await this.listUsers();
    return users.filter(
      (user) => user.role === ADMINISTRATOR_ROLE && String(user.status).toLowerCase() === "active",
    ).length;
  }

  async updateUserRoleField(userKey: string, role: string): Promise<void> {
    await this.database.ref(USER_PATH).child(userKey).child("role").set(role);
  }

  async updateUserStatusField(userKey: string, status: AdminUserStatus): Promise<void> {
    await this.database.ref(USER_PATH).child(userKey).child("status").set(status);
  }

  async updatePrivilegeRoleField(
    privilegeKey: string,
    role: string,
    enabled: boolean,
  ): Promise<void> {
    await this.database.ref(PRIVILEGE_PATH).child(privilegeKey).child(role).set(enabled);
  }
}
