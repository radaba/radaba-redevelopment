import "server-only";

import type { Auth } from "firebase-admin/auth";
import type { Database } from "firebase-admin/database";
import { firebaseAdminAuth, firebaseAdminDatabase } from "@/lib/firebase/admin";
import { createAdministratorAuditRecord } from "@/features/admin/administrator-audit-contract";
import {
  IdentityRepairError,
  type IdentityRepairAuth,
  type IdentityRepairRepository,
  type RepairUserRecord,
} from "./user-identity-repair-service";

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);
const record = (key: string, value: unknown): RepairUserRecord => {
  const item =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return { key, uid: text(item.uid), email: text(item.email), name: text(item.name) };
};
const notFound = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  String(error.code) === "auth/user-not-found";

export class FirebaseIdentityRepairAuth implements IdentityRepairAuth {
  constructor(private readonly auth: Auth = firebaseAdminAuth) {}
  async findByEmail(email: string) {
    try {
      const user = await this.auth.getUserByEmail(email);
      return { uid: user.uid, email: user.email ?? null };
    } catch (error) {
      if (notFound(error)) return null;
      throw error;
    }
  }
  async findByUid(uid: string) {
    try {
      const user = await this.auth.getUser(uid);
      return { uid: user.uid, email: user.email ?? null };
    } catch (error) {
      if (notFound(error)) return null;
      throw error;
    }
  }
}

export class FirebaseIdentityRepairRepository implements IdentityRepairRepository {
  constructor(
    private readonly database: Database = firebaseAdminDatabase,
    private readonly now = () => new Date(),
  ) {}
  async findUser(key: string) {
    const snapshot = await this.database.ref("user").child(key).once("value");
    return snapshot.exists() ? record(key, snapshot.val()) : null;
  }
  private async matching(field: "uid" | "email", value: string) {
    const snapshot = await this.database
      .ref("user")
      .orderByChild(field)
      .equalTo(value)
      .once("value");
    const found: RepairUserRecord[] = [];
    snapshot.forEach((child) => {
      found.push(record(child.key ?? "", child.val()));
    });
    return found;
  }
  findUsersByUid(uid: string) {
    return this.matching("uid", uid);
  }
  async findUsersByEmail(email: string) {
    const snapshot = await this.database.ref("user").once("value");
    const found: RepairUserRecord[] = [];
    snapshot.forEach((child) => {
      const item = record(child.key ?? "", child.val());
      if (item.email?.trim().toLowerCase() === email.trim().toLowerCase()) found.push(item);
    });
    return found;
  }
  async commitUidAndAudit(input: Parameters<IdentityRepairRepository["commitUidAndAudit"]>[0]) {
    const auditRef = this.database.ref("administrator_audit").push();
    if (!auditRef.key)
      throw new IdentityRepairError("audit_failed", "Audit identifier generation failed.", 500);
    const auditId = auditRef.key,
      timestamp = this.now().toISOString();
    const audit = createAdministratorAuditRecord(auditId, timestamp, input.audit);
    let failure: IdentityRepairError | null = null;
    let finalUser: RepairUserRecord | null = null;
    let result;
    try {
      result = await this.database.ref().transaction(
        (rootValue) => {
          const root =
            typeof rootValue === "object" && rootValue !== null
              ? (rootValue as Record<string, unknown>)
              : {};
          const users =
            typeof root.user === "object" && root.user !== null
              ? (root.user as Record<string, unknown>)
              : {};
          const currentRaw = users[input.userKey];
          if (!currentRaw) {
            failure = new IdentityRepairError("user_not_found", "User was deleted.", 404);
            return;
          }
          const current = record(input.userKey, currentRaw);
          if (
            current.uid !== input.expectedUid ||
            current.email?.trim().toLowerCase() !== input.expectedEmail
          ) {
            failure = new IdentityRepairError("user_changed", "The user changed after preview.");
            return;
          }
          const conflicts = Object.entries(users).filter(
            ([key, value]) => key !== input.userKey && record(key, value).uid === input.targetUid,
          );
          if (conflicts.length) {
            failure = new IdentityRepairError(
              "target_uid_already_linked",
              "Another profile acquired the target UID.",
            );
            return;
          }
          const emailMatches = Object.entries(users).filter(
            ([, value]) => record("", value).email?.trim().toLowerCase() === input.targetEmail,
          );
          if (emailMatches.length !== 1) {
            failure = new IdentityRepairError(
              "duplicate_email",
              "The target email is no longer unique.",
            );
            return;
          }
          const mutableUser = { ...(currentRaw as Record<string, unknown>), uid: input.targetUid };
          const audits =
            typeof root.administrator_audit === "object" && root.administrator_audit !== null
              ? (root.administrator_audit as Record<string, unknown>)
              : {};
          finalUser = record(input.userKey, mutableUser);
          return {
            ...root,
            user: { ...users, [input.userKey]: mutableUser },
            administrator_audit: { ...audits, [auditId]: audit },
          };
        },
        undefined,
        false,
      );
    } catch {
      throw new IdentityRepairError(
        "transaction_conflict",
        "Identity repair transaction failed.",
        409,
      );
    }
    if (failure) throw failure;
    if (!result.committed || !finalUser)
      throw new IdentityRepairError(
        "transaction_conflict",
        "Identity repair transaction was not committed.",
      );
    return { user: finalUser, auditId, timestamp };
  }
}
