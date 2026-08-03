import "server-only";

import {
  ADMINISTRATOR_PRIVILEGE_PATH,
  ADMINISTRATOR_ROLE,
} from "@/features/admin/admin-authorization";
import { ADMIN_USER_STATUSES, type AdminUserStatus } from "@/features/admin/admin-types";
import type { AdminCommandRepository } from "./admin-data-repository";
import type { NotificationProducer } from "@/server/notification/firebase-notification-producer";
import { AdminCommandError } from "./admin-errors";
import { administratorRoleWriteError } from "@/features/admin/administrator-role-contract";
import {
  recordAdministratorAudit,
  type AdministratorAuditAppendRepository,
} from "@/features/admin/administrator-audit-contract";

interface AdministratorAuditCommandContext {
  actorUid: string;
  actorEmail: string;
  requestIdentifier: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AdminCommandService {
  constructor(
    private readonly repository: AdminCommandRepository,
    private readonly audit?: AdministratorAuditAppendRepository,
    private readonly notifications?: NotificationProducer,
  ) {}

  async updateUserRole(input: {
    actorUid: string;
    actorEmail?: string;
    requestIdentifier?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    targetUserKey: string;
    role: unknown;
    previousRole: unknown;
  }) {
    if (typeof input.role !== "string" || typeof input.previousRole !== "string") {
      throw new AdminCommandError("MALFORMED", "Role and previous role are required.");
    }
    const roleError = administratorRoleWriteError(input.role);
    if (roleError) throw new AdminCommandError("INVALID_VALUE", roleError);
    const target = await this.repository.findUser(input.targetUserKey);
    if (!target) throw new AdminCommandError("NOT_FOUND", "User was not found.");
    if (target.role !== input.previousRole)
      throw new AdminCommandError("CONFLICT", "The user role changed. Refresh and retry.");
    if (
      target.role === ADMINISTRATOR_ROLE &&
      input.role !== ADMINISTRATOR_ROLE &&
      String(target.status).toLowerCase() === "active" &&
      (await this.repository.countActiveAdministrators()) <= 1
    ) {
      throw new AdminCommandError("CONFLICT", "The final active administrator cannot be demoted.");
    }
    await this.repository.updateUserRoleField(input.targetUserKey, input.role);
    await this.auditChange(
      {
        ...input,
        actorEmail: input.actorEmail ?? "",
        requestIdentifier: input.requestIdentifier ?? "unavailable",
      },
      "user.role.changed",
      input.targetUserKey,
      "Changed user role.",
      { role: target.role },
      { role: input.role },
    );
    await this.notifications?.deliver({ type: "user_role_changed", category: "administration", title: "User role changed", message: `Your Radaba role changed from ${target.role} to ${input.role}.`, recipientUserKeys: [input.targetUserKey], recipientEmails: [input.actorEmail ?? ""], targetType: "user", targetKey: input.targetUserKey, route: `/home/admin/users/${encodeURIComponent(input.targetUserKey)}`, severity: "warning", operationId: `user-role:${input.targetUserKey}:${target.role}:${input.role}` });
    this.log(input.actorUid, input.targetUserKey, "role", target.role, input.role);
    return { ...target, role: input.role };
  }

  async updateUserStatus(input: {
    actorUid: string;
    actorEmail?: string;
    requestIdentifier?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    targetUserKey: string;
    status: unknown;
    previousStatus: unknown;
  }) {
    if (typeof input.status !== "string" || typeof input.previousStatus !== "string") {
      throw new AdminCommandError("MALFORMED", "Status and previous status are required.");
    }
    if (!ADMIN_USER_STATUSES.includes(input.status as AdminUserStatus)) {
      throw new AdminCommandError("INVALID_VALUE", "Status is not supported.");
    }
    const target = await this.repository.findUser(input.targetUserKey);
    if (!target) throw new AdminCommandError("NOT_FOUND", "User was not found.");
    if (target.status !== input.previousStatus)
      throw new AdminCommandError("CONFLICT", "The user status changed. Refresh and retry.");
    if (
      target.role === ADMINISTRATOR_ROLE &&
      input.status === "Not Active" &&
      String(target.status).toLowerCase() === "active" &&
      (await this.repository.countActiveAdministrators()) <= 1
    ) {
      throw new AdminCommandError(
        "CONFLICT",
        "The final active administrator cannot be deactivated.",
      );
    }
    await this.repository.updateUserStatusField(
      input.targetUserKey,
      input.status as AdminUserStatus,
    );
    await this.auditChange(
      {
        ...input,
        actorEmail: input.actorEmail ?? "",
        requestIdentifier: input.requestIdentifier ?? "unavailable",
      },
      "user.status.changed",
      input.targetUserKey,
      "Changed user status.",
      { status: target.status },
      { status: input.status },
    );
    await this.notifications?.deliver({ type: "user_deactivated", category: "administration", title: input.status === "Not Active" ? "Account deactivated" : "Account status changed", message: `Your Radaba account status changed to ${input.status}.`, recipientUserKeys: [input.targetUserKey], recipientEmails: [input.actorEmail ?? ""], targetType: "user", targetKey: input.targetUserKey, severity: input.status === "Not Active" ? "critical" : "warning", operationId: `user-status:${input.targetUserKey}:${target.status}:${input.status}` });
    this.log(input.actorUid, input.targetUserKey, "status", target.status, input.status);
    return { ...target, status: input.status };
  }

  async updatePrivilegeForRole(input: {
    actorUid: string;
    privilegeKey: string;
    role: unknown;
    enabled: unknown;
    previousValue: unknown;
  }) {
    if (
      typeof input.role !== "string" ||
      typeof input.enabled !== "boolean" ||
      typeof input.previousValue !== "boolean"
    ) {
      throw new AdminCommandError("MALFORMED", "Role and strict boolean values are required.");
    }
    const [record, roles] = await Promise.all([
      this.repository.findPrivilege(input.privilegeKey),
      this.repository.supportedRoles(),
    ]);
    if (!record) throw new AdminCommandError("NOT_FOUND", "Privilege record was not found.");
    if (!roles.includes(input.role) || !Object.hasOwn(record.roleValues, input.role)) {
      throw new AdminCommandError("INVALID_VALUE", "Role is not an existing privilege field.");
    }
    if (record.roleValues[input.role] !== input.previousValue) {
      throw new AdminCommandError("CONFLICT", "The privilege changed. Refresh and retry.");
    }
    if (
      record.path === ADMINISTRATOR_PRIVILEGE_PATH &&
      input.role === ADMINISTRATOR_ROLE &&
      input.enabled === false
    ) {
      const remaining = (await this.repository.listPrivileges()).some(
        (candidate) =>
          candidate.key !== record.key &&
          candidate.path === ADMINISTRATOR_PRIVILEGE_PATH &&
          candidate.roleValues[ADMINISTRATOR_ROLE] === true,
      );
      if (!remaining)
        throw new AdminCommandError("CONFLICT", "Final administrator access cannot be removed.");
    }
    await this.repository.updatePrivilegeRoleField(input.privilegeKey, input.role, input.enabled);
    const affected = (await this.repository.listUsers()).filter((user) => user.role === input.role).map((user) => user.key);
    await this.notifications?.deliver({type:"privilege_changed",category:"administration",title:"Role privilege changed",message:`A Radaba privilege for role ${input.role} was ${input.enabled?"enabled":"disabled"}.`,recipientUserKeys:affected,targetType:"privilege",targetKey:input.privilegeKey,severity:"warning",operationId:`privilege:${input.privilegeKey}:${input.role}:${input.enabled}`});
    this.log(
      input.actorUid,
      input.privilegeKey,
      `privilege.${input.role}`,
      input.previousValue,
      input.enabled,
    );
    return { ...record, roleValues: { ...record.roleValues, [input.role]: input.enabled } };
  }

  private log(
    actorUid: string,
    targetKey: string,
    field: string,
    previousValue: unknown,
    newValue: unknown,
  ) {
    console.info("Admin change", { actorUid, targetKey, field, previousValue, newValue });
  }

  private async auditChange(
    context: AdministratorAuditCommandContext,
    action: string,
    resourceIdentifier: string,
    summary: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
  ) {
    if (!this.audit) return;
    await recordAdministratorAudit(this.audit, {
      administratorIdentifier: context.actorUid,
      administratorEmail: context.actorEmail,
      action,
      resourceType: "user",
      resourceIdentifier,
      summary,
      before,
      after,
      requestIdentifier: context.requestIdentifier,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
  }
}
