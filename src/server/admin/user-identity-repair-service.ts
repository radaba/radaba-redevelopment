import "server-only";

import { createHash } from "node:crypto";
import type { AdministratorAuditRecord } from "@/features/admin/administrator-audit-contract";

export const IDENTITY_REPAIR_CONFIRMATION = "REPAIR USER IDENTITY";

export type IdentityRepairErrorCode =
  | "user_not_found"
  | "auth_user_not_found"
  | "user_changed"
  | "email_mismatch"
  | "duplicate_uid"
  | "duplicate_email"
  | "target_uid_already_linked"
  | "identity_ownership_ambiguous"
  | "unauthorized"
  | "audit_failed"
  | "transaction_conflict"
  | "invalid_request"
  | "legacy_uid_missing"
  | "already_repaired";

export class IdentityRepairError extends Error {
  constructor(
    public readonly code: IdentityRepairErrorCode,
    message: string,
    public readonly status = 409,
  ) {
    super(message);
    this.name = "IdentityRepairError";
  }
}

export interface RepairUserRecord {
  key: string;
  uid: string | null;
  email: string | null;
  name: string | null;
}

export interface RepairAuthUser {
  uid: string;
  email: string | null;
}

export interface IdentityRepairRepository {
  findUser(key: string): Promise<RepairUserRecord | null>;
  findUsersByUid(uid: string): Promise<RepairUserRecord[]>;
  findUsersByEmail(email: string): Promise<RepairUserRecord[]>;
  commitUidAndAudit(input: {
    userKey: string;
    expectedUid: string | null;
    expectedEmail: string;
    targetUid: string;
    targetEmail: string;
    audit: Omit<AdministratorAuditRecord, "auditId" | "timestamp">;
  }): Promise<{ user: RepairUserRecord; auditId: string; timestamp: string }>;
}

export interface IdentityRepairAuth {
  findByEmail(email: string): Promise<RepairAuthUser | null>;
  findByUid(uid: string): Promise<RepairAuthUser | null>;
}

export interface IdentityRepairContext {
  actorUid: string;
  actorEmail: string;
  requestIdentifier: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const normalizedEmail = (value: string | null) => value?.trim().toLowerCase() || null;
const baselineFor = (userKey: string, uid: string | null, email: string, targetUid: string) =>
  createHash("sha256")
    .update(JSON.stringify([userKey, uid, email, targetUid]))
    .digest("hex");

export interface IdentityRepairPreview {
  userKey: string;
  profile: { displayName: string | null; email: string };
  firebaseAuth: { uid: string; email: string };
  storedIdentity: { uid: string | null; email: string };
  checks: {
    targetUidMatchCount: number;
    emailMatchCount: number;
    existingUidAuthAccountExists: boolean;
    emailConsistent: boolean;
  };
  proposedChange: { field: "uid"; before: string | null; after: string };
  unchangedFields: string[];
  canRepair: boolean;
  blockers: IdentityRepairErrorCode[];
  warnings: string[];
  baseline: string;
}

export class UserIdentityRepairService {
  constructor(
    private readonly repository: IdentityRepairRepository,
    private readonly auth: IdentityRepairAuth,
  ) {}

  async preview(userKey: string): Promise<IdentityRepairPreview> {
    const user = await this.repository.findUser(userKey);
    if (!user) throw new IdentityRepairError("user_not_found", "User was not found.", 404);
    const email = normalizedEmail(user.email);
    if (!email) throw new IdentityRepairError("email_mismatch", "The profile email is missing.");
    const authUser = await this.auth.findByEmail(email);
    if (!authUser) {
      throw new IdentityRepairError(
        "auth_user_not_found",
        "Firebase Authentication user was not found.",
        404,
      );
    }
    const authEmail = normalizedEmail(authUser.email);
    if (!authEmail || authEmail !== email) {
      throw new IdentityRepairError(
        "email_mismatch",
        "Profile and Firebase Authentication emails do not match.",
      );
    }
    const [uidMatches, emailMatches, storedUidAuth] = await Promise.all([
      this.repository.findUsersByUid(authUser.uid),
      this.repository.findUsersByEmail(email),
      user.uid && user.uid !== authUser.uid ? this.auth.findByUid(user.uid) : Promise.resolve(null),
    ]);
    const targetOwnedElsewhere = uidMatches.some((match) => match.key !== userKey);
    const blockers: IdentityRepairErrorCode[] = [];
    if (emailMatches.length !== 1 || emailMatches[0]?.key !== userKey)
      blockers.push("duplicate_email");
    if (uidMatches.length > 1) blockers.push("duplicate_uid");
    if (targetOwnedElsewhere) blockers.push("target_uid_already_linked");
    if (storedUidAuth) blockers.push("identity_ownership_ambiguous");
    if (!user.uid) blockers.push("legacy_uid_missing");
    if (user.uid === authUser.uid) blockers.push("already_repaired");
    return {
      userKey,
      profile: { displayName: user.name, email },
      firebaseAuth: { uid: authUser.uid, email: authEmail },
      storedIdentity: { uid: user.uid, email },
      checks: {
        targetUidMatchCount: uidMatches.length,
        emailMatchCount: emailMatches.length,
        existingUidAuthAccountExists: Boolean(storedUidAuth),
        emailConsistent: true,
      },
      proposedChange: { field: "uid", before: user.uid, after: authUser.uid },
      unchangedFields: [
        "email",
        "name",
        "phone",
        "role",
        "privileges",
        "status",
        "administrator state",
        "company",
        "profile-photo metadata",
      ],
      canRepair: blockers.length === 0,
      blockers,
      warnings: user.uid
        ? []
        : [
            "The stored UID is missing; the existing legacy compatibility policy may already apply.",
          ],
      baseline: baselineFor(userKey, user.uid, email, authUser.uid),
    };
  }

  async commit(
    userKey: string,
    input: { baseline?: unknown; reason?: unknown; confirmation?: unknown },
    context: IdentityRepairContext,
  ) {
    if (input.confirmation !== IDENTITY_REPAIR_CONFIRMATION) {
      throw new IdentityRepairError(
        "invalid_request",
        "Type the required confirmation phrase.",
        422,
      );
    }
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    if (reason.length < 5 || reason.length > 500) {
      throw new IdentityRepairError(
        "invalid_request",
        "Administrator reason must be 5 to 500 characters.",
        422,
      );
    }
    const preview = await this.preview(userKey);
    if (typeof input.baseline !== "string" || input.baseline !== preview.baseline) {
      throw new IdentityRepairError(
        "user_changed",
        "The identity changed after preview. Preview again.",
      );
    }
    if (!preview.canRepair) {
      const code = preview.blockers[0] ?? "transaction_conflict";
      throw new IdentityRepairError(
        code,
        "Identity repair is blocked. Preview again and review the checks.",
      );
    }
    return this.repository.commitUidAndAudit({
      userKey,
      expectedUid: preview.storedIdentity.uid,
      expectedEmail: preview.storedIdentity.email,
      targetUid: preview.firebaseAuth.uid,
      targetEmail: preview.firebaseAuth.email,
      audit: {
        administratorIdentifier: context.actorUid,
        administratorEmail: context.actorEmail,
        action: "user.identity.repaired",
        resourceType: "user",
        resourceIdentifier: userKey,
        summary: "Repaired the stored Firebase identity UID.",
        before: { uid: preview.storedIdentity.uid, email: preview.storedIdentity.email },
        after: { uid: preview.firebaseAuth.uid, email: preview.storedIdentity.email },
        requestIdentifier: context.requestIdentifier,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
        reason,
        confirmationMethod: IDENTITY_REPAIR_CONFIRMATION,
        previewBaseline: preview.baseline,
        source: "administrator_identity_repair",
      } as Omit<AdministratorAuditRecord, "auditId" | "timestamp">,
    });
  }
}
