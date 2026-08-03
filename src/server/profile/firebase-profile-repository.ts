import "server-only";
import type { Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { createHash } from "node:crypto";
import { profileTransactionAbortStatus, selectProfileTransactionCandidate } from "@/features/profile/profile-transaction.mjs";
import {
  normalizeProfileEditable,
  profileChangedFields,
  type ProfileEditable,
} from "@/features/profile/profile-contract";
import type {
  ProfileRepository,
  ProfileUpdateResult,
  SelfProfileRecord,
} from "./profile-repository";

const USER_PATH = "user";
const string = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);
const profile = (key: string, raw: Record<string, unknown>): SelfProfileRecord => ({
  key,
  uid: string(raw.uid),
  email: string(raw.email),
  name: string(raw.name),
  phone: string(raw.phone),
  role: string(raw.role),
  status: string(raw.status),
  company: string(raw.company),
  department: string(raw.department),
  region: string(raw.region),
  photoUrl: string(raw.photo_url),
  photoName: string(raw.photo_name),
  photoStoragePath: string(raw.photo_storage_path),
  photoUpdatedAt: string(raw.photo_updated_at ?? raw.updated_at),
});

export class FirebaseProfileRepository implements ProfileRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  private async find(field: "uid" | "email", value: string) {
    const snapshot = await this.database
        .ref(USER_PATH)
        .orderByChild(field)
        .equalTo(value)
        .once("value"),
      records: SelfProfileRecord[] = [];
    snapshot.forEach((child) => {
      records.push(profile(child.key ?? "", child.val() ?? {}));
    });
    return records;
  }
  findByUid(authUid: string) {
    return this.find("uid", authUid);
  }
  findByEmail(email: string) {
    return this.find("email", email);
  }

  async updateEditable(
    userKey: string,
    expected: ProfileEditable,
    next: ProfileEditable,
  ): Promise<ProfileUpdateResult> {
    const reference = this.database.ref(USER_PATH).child(userKey);
    const preReadSnapshot = await reference.once("value");
    if (!preReadSnapshot.exists()) return { status: "not_found" };
    const preReadRecord = preReadSnapshot.val() as Record<string, unknown>;
    let callbackCount = 0,
      observedNonNull = false,
      abortReason: string | null = null,
      before: ProfileEditable | undefined,
      changedFields: Array<keyof ProfileEditable> = [];
    const trace: Array<{ invocation: number; currentIsNull: boolean; candidateSource: string; updaterReturn: string }> = [];
    const transactionResult = await reference.transaction(
      (transactionCurrent) => {
        callbackCount += 1;
        const selected = selectProfileTransactionCandidate(
          transactionCurrent,
          preReadRecord,
          observedNonNull,
        );
        observedNonNull = selected.observedNonNull;
        if (!selected.candidate) {
          abortReason = selected.abortReason;
          trace.push({ invocation: callbackCount, currentIsNull: transactionCurrent == null, candidateSource: selected.source, updaterReturn: "undefined_abort" });
          return;
        }
        const raw = selected.candidate as Record<string, unknown>;
        before = normalizeProfileEditable(raw);
        if (before.name !== expected.name || before.phone !== expected.phone) {
          abortReason = "profile_changed";
          trace.push({ invocation: callbackCount, currentIsNull: transactionCurrent == null, candidateSource: selected.source, updaterReturn: "undefined_profile_changed" });
          return;
        }
        changedFields = profileChangedFields(before, next);
        if (!changedFields.length) {
          abortReason = "unchanged";
          trace.push({ invocation: callbackCount, currentIsNull: transactionCurrent == null, candidateSource: selected.source, updaterReturn: "undefined_unchanged" });
          return;
        }
        const updated: Record<string, unknown> = { ...raw };
        updated.name = next.name;
        if (next.phone) updated.phone = next.phone;
        else delete updated.phone;
        trace.push({ invocation: callbackCount, currentIsNull: transactionCurrent == null, candidateSource: selected.source, updaterReturn: "object_proposal" });
        return updated;
      },
      undefined,
      false,
    );
    if (process.env.NODE_ENV !== "production") {
      const hash = (value: unknown) => createHash("sha256").update(String(value ?? "")).digest("hex").slice(0, 12);
      console.info("Profile transaction diagnostic", {
        resolvedUserKeyHash: hash(userKey),
        rtdbPathHash: hash(`${USER_PATH}/${userKey}`),
        preReadExists: preReadSnapshot.exists(),
        preReadNameHash: hash(preReadRecord.name),
        preReadPhoneHash: hash(preReadRecord.phone),
        callbackCount,
        trace,
        abortReason,
        applyLocally: false,
        committed: transactionResult.committed,
        resultSnapshotExists: transactionResult.snapshot.exists(),
      });
    }
    if (transactionResult.committed && transactionResult.snapshot.exists()) {
      const raw = transactionResult.snapshot.val() as Record<string, unknown>;
      return { status: "updated", profile: profile(userKey, raw), before, changedFields };
    }
    if (abortReason === "unchanged")
      return { status: "unchanged", profile: profile(userKey, preReadRecord), before, changedFields };
    return { status: profileTransactionAbortStatus(abortReason) };
  }
}
