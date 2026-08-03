import "server-only";
import { randomBytes } from "node:crypto";
import {
  validateUserInvitation,
  type UserInvitationInput,
  type ValidUserInvitation,
} from "@/features/admin/user-invitation-contract";
import {
  recordAdministratorAudit,
  type AdministratorAuditAppendRepository,
} from "@/features/admin/administrator-audit-contract";
import { AdminCommandError } from "./admin-errors";
import { administratorAssignableRoleIds } from "@/features/admin/administrator-role-contract";

export interface InvitationAuthGateway {
  emailExists(email: string): Promise<boolean>;
  create(email: string, password: string, name: string): Promise<{ uid: string }>;
  remove(uid: string): Promise<void>;
}
export interface InvitationUserRepository {
  supportedRoles(): Promise<string[]>;
  emailExists(email: string): Promise<boolean>;
  create(uid: string, input: ValidUserInvitation): Promise<{ key: string }>;
}
export interface InvitationContext {
  actorUid: string;
  actorEmail: string;
  requestIdentifier: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export class UserInvitationService {
  constructor(
    private readonly repository: InvitationUserRepository,
    private readonly auth: InvitationAuthGateway,
    private readonly audit: AdministratorAuditAppendRepository,
  ) {}
  async invite(raw: UserInvitationInput, context: InvitationContext) {
    const validation = validateUserInvitation(raw, administratorAssignableRoleIds());
    if (!validation.success)
      throw new AdminCommandError(
        "MALFORMED",
        Object.values(validation.errors)[0] ?? "Invitation details are invalid.",
        validation.errors,
      );
    const input = validation.value;
    let duplicate = false;
    try {
      duplicate = await Promise.all([
        this.repository.emailExists(input.email),
        this.auth.emailExists(input.email),
      ]).then((values) => values.some(Boolean));
    } catch {
      throw new AdminCommandError(
        "UNAVAILABLE",
        "Existing accounts could not be checked. No user was created.",
      );
    }
    if (duplicate)
      throw new AdminCommandError("CONFLICT", "A user with this email already exists.");
    let account: { uid: string };
    try {
      account = await this.auth.create(input.email, temporaryPassword(), input.name);
    } catch (error) {
      if (authCode(error) === "auth/email-already-exists")
        throw new AdminCommandError("CONFLICT", "A user with this email already exists.");
      throw new AdminCommandError(
        "UNAVAILABLE",
        "Firebase Authentication could not create the user.",
      );
    }
    let created: { key: string };
    try {
      created = await this.repository.create(account.uid, input);
    } catch {
      try {
        await this.auth.remove(account.uid);
      } catch {
        console.error("User provisioning compensation failed", {
          uid: account.uid,
          requestIdentifier: context.requestIdentifier,
        });
        throw new AdminCommandError(
          "UNAVAILABLE",
          `Provisioning partially completed. Contact an administrator with request ID ${context.requestIdentifier}.`,
        );
      }
      throw new AdminCommandError(
        "UNAVAILABLE",
        "The application profile could not be created. The Authentication account was removed; retry the invitation.",
      );
    }
    await recordAdministratorAudit(this.audit, {
      administratorIdentifier: context.actorUid,
      administratorEmail: context.actorEmail,
      action: "user.invited",
      resourceType: "user",
      resourceIdentifier: created.key,
      summary: "Invited application user.",
      before: {},
      after: {
        uid: account.uid,
        email: input.email,
        name: input.name,
        role: input.role,
        status: "Active",
        company: input.company,
        department: input.department,
        region: input.region,
        phone: input.phone || null,
      },
      requestIdentifier: context.requestIdentifier,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return {
      key: created.key,
      uid: account.uid,
      name: input.name,
      email: input.email,
      role: input.role,
      status: "Active" as const,
      company: input.company,
      region: input.region,
    };
  }
}
function temporaryPassword() {
  return `A!9${randomBytes(30).toString("base64url")}`;
}
function authCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
}
