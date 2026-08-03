import "server-only";
import { createHash } from "node:crypto";
import type { ProfileRepository, SelfProfileRecord } from "./profile-repository";
import { ProfileServiceError, type ProfileActor } from "./profile-service";
export interface AuthenticatedProfile {
  authUid: string;
  userKey: string;
  storedUid: string;
  email: string;
  record: SelfProfileRecord;
  lookupStrategy: "stored_uid" | "verified_email_compatibility";
  compatibility: boolean;
}
const hash = (value: unknown) =>
  createHash("sha256")
    .update(String(value ?? ""))
    .digest("hex")
    .slice(0, 12);
export function profileIdentityDiagnostic(input: {
  route: string;
  actor: ProfileActor;
  record?: SelfProfileRecord;
  lookupStrategy: string;
  uidMatches: SelfProfileRecord[];
  emailMatches: SelfProfileRecord[];
  body?: unknown;
  result: string;
  repositoryName?: string;
}) {
  if (process.env.NODE_ENV === "production") return;
  const body =
    input.body && typeof input.body === "object" && !Array.isArray(input.body)
      ? (input.body as Record<string, unknown>)
      : {};
  const clientIdentityFields = Object.fromEntries(
    ["uid", "authUid", "userKey", "userId", "email", "id", "profileId"]
      .filter((key) => Object.hasOwn(body, key))
      .map((key) => [key, { type: typeof body[key], hash: hash(body[key]) }]),
  );
  console.info("Profile identity diagnostic", {
    route: input.route,
    authUidHash: hash(input.actor.uid),
    sessionEmailHash: hash(input.actor.email),
    rtdbRoot: "user",
    resolverInvoked: true,
    repositoryName: input.repositoryName ?? "ProfileRepository",
    userKeyHash: input.record ? hash(input.record.key) : null,
    storedUidField: "uid",
    storedUidHash: input.record ? hash(input.record.uid) : null,
    storedEmailHash: input.record ? hash(input.record.email) : null,
    uidMatchCount: input.uidMatches.length,
    emailMatchCount: input.emailMatches.length,
    uidMatchingUserKeyHashes: input.uidMatches.map((item) => hash(item.key)),
    emailMatchingUserKeyHashes: input.emailMatches.map((item) => hash(item.key)),
    identityComparison: input.record?.uid === input.actor.uid,
    lookupStrategy: input.lookupStrategy,
    clientIdentityFields,
    result: input.result,
  });
}
export function profileMutationDiagnostic(actor: ProfileActor, userKey: string, result: string) {
  if (process.env.NODE_ENV === "production") return;
  console.info("Profile mutation diagnostic", {
    route: "profile_update",
    authUidHash: hash(actor.uid),
    sessionEmailHash: hash(actor.email),
    resolverInvoked: true,
    rtdbRoot: "user",
    resolvedUserKeyHash: hash(userKey),
    finalWritePathHash: hash(`user/${userKey}`),
    result,
  });
}
const fail = (code: string, status: number, message: string): never => {
  throw new ProfileServiceError(code, status, message);
};
export async function resolveAuthenticatedProfile(
  repository: ProfileRepository,
  actor: ProfileActor,
  context: { route: string; body?: unknown },
): Promise<AuthenticatedProfile> {
  const [uidMatches, emailMatches] = await Promise.all([
      repository.findByUid(actor.uid),
      repository.findByEmail(actor.email),
    ]),
    diagnostic = (record: SelfProfileRecord | undefined, lookupStrategy: string, result: string) =>
      profileIdentityDiagnostic({
        route: context.route,
        actor,
        record,
        lookupStrategy,
        uidMatches,
        emailMatches,
        body: context.body,
        result,
        repositoryName: repository.constructor?.name,
      });
  if (uidMatches.length > 1) {
    diagnostic(undefined, "stored_uid", "duplicate_uid");
    return fail(
      "duplicate_uid",
      409,
      "Multiple profiles use the same Firebase identity. Contact an administrator.",
    );
  }
  if (emailMatches.length > 1) {
    diagnostic(undefined, "verified_email_diagnostic", "duplicate_email");
    return fail(
      "duplicate_email",
      409,
      "Multiple profiles use the same email address. Contact an administrator.",
    );
  }
  if (uidMatches.length === 1) {
    const record = uidMatches[0];
    if (emailMatches.length === 1 && emailMatches[0].key !== record.key) {
      diagnostic(record, "uid_email_cross_check", "profile_identity_corrupt");
      return fail(
        "profile_identity_corrupt",
        409,
        "Your Firebase UID and email point to different profile records. Contact an administrator.",
      );
    }
    if (record.email.trim().toLowerCase() !== actor.email.trim().toLowerCase()) {
      diagnostic(record, "uid_email_cross_check", "profile_identity_corrupt");
      return fail(
        "profile_identity_corrupt",
        409,
        "Your profile is linked to a different email identity. Contact an administrator.",
      );
    }
    diagnostic(record, "stored_uid", "resolved");
    return {
      authUid: actor.uid,
      userKey: record.key,
      storedUid: record.uid,
      email: actor.email,
      record,
      lookupStrategy: "stored_uid",
      compatibility: false,
    };
  }
  if (emailMatches.length === 1) {
    const record = emailMatches[0];
    if (record.uid) {
      diagnostic(record, "verified_email_diagnostic", "uid_mismatch");
      return fail(
        "profile_identity_corrupt",
        409,
        "Your profile is linked to a different Firebase identity. Contact an administrator.",
      );
    }
    diagnostic(record, "verified_email_compatibility", "uid_missing_email_unique");
    return {
      authUid: actor.uid,
      userKey: record.key,
      storedUid: "",
      email: actor.email,
      record,
      lookupStrategy: "verified_email_compatibility",
      compatibility: true,
    };
  }
  diagnostic(undefined, "stored_uid", "profile_not_found");
  return fail(
    "profile_not_found",
    404,
    "No profile record is linked to your authenticated account.",
  );
}
