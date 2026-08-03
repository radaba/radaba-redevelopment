import "server-only";
import {
  recordAdministratorAudit,
  type AdministratorAuditAppendRepository,
} from "@/features/admin/administrator-audit-contract";
import { validateProfileUpdate } from "@/features/profile/profile-contract";
import type { ProfileRepository, SelfProfileRecord } from "./profile-repository";
import { profileMutationDiagnostic, resolveAuthenticatedProfile } from "./authenticated-profile-resolver";

export class ProfileServiceError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export interface ProfileActor {
  uid: string;
  email: string;
}
export interface ProfileRequestContext {
  requestIdentifier: string;
  ipAddress: string | null;
  userAgent: string | null;
}
const sanitize = (record: SelfProfileRecord) => ({
  name: record.name,
  phone: record.phone,
  email: record.email,
  role: record.role,
  status: record.status,
  company: record.company,
  department: record.department,
  region: record.region,
});

export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly audit: AdministratorAuditAppendRepository,
  ) {}
  async read(actor: ProfileActor) {
    const { record } = await resolveAuthenticatedProfile(this.repository, actor, {
      route: "profile_read",
    });
    return sanitize(record);
  }
  async update(actor: ProfileActor, body: unknown, context: ProfileRequestContext) {
    const validation = validateProfileUpdate(body);
    if (!validation.success)
      throw new ProfileServiceError(
        validation.code === "unauthorized_fields"
          ? "unauthorized_identity_override"
          : "validation_error",
        400,
        validation.message,
      );
    const { record, userKey, lookupStrategy } = await resolveAuthenticatedProfile(
      this.repository,
      actor,
      {
        route: "profile_update",
        body,
      },
    );
    let result;
    try {
      result = await this.repository.updateEditable(userKey, validation.value.expected, {
        name: validation.value.name,
        phone: validation.value.phone,
      });
    } catch {
      throw new ProfileServiceError("profile_update_failed", 500, "Profile update failed.");
    }
    profileMutationDiagnostic(actor, userKey, result.status);
    if (result.status === "profile_changed")
      throw new ProfileServiceError(
        "profile_changed",
        409,
        "Your profile was updated after this form was opened. Refresh and try again.",
      );
    if (result.status === "transaction_conflict")
      throw new ProfileServiceError(
        "transaction_conflict",
        409,
        "The profile update could not be committed because of a concurrent database update. Refresh and try again.",
      );
    if (result.status === "not_found" || !result.profile)
      throw new ProfileServiceError(
        "profile_not_found",
        404,
        "No profile record is linked to your authenticated account.",
      );
    if (result.status === "updated" && result.before && result.changedFields?.length) {
      const before = Object.fromEntries(
        result.changedFields.map((field) => [field, result.before?.[field] ?? ""]),
      );
      const after = Object.fromEntries(
        result.changedFields.map((field) => [field, result.profile?.[field] ?? ""]),
      );
      await recordAdministratorAudit(this.audit, {
        administratorIdentifier: actor.uid,
        administratorEmail: actor.email,
        action: "profile_self_service_update",
        resourceType: "user_profile",
        resourceIdentifier: record.key,
        summary: `Updated profile fields: ${result.changedFields.join(", ")}`,
        before,
        after: { ...after, source: "profile_self_service", identity_resolution: lookupStrategy },
        ...context,
      });
    }
    return { profile: sanitize(result.profile), changedFields: result.changedFields ?? [] };
  }
}
