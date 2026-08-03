export function validAdminUserKey(value) {
  return value.length > 0 && value.length <= 128 && !/[.#$[\]/\u0000-\u001f\u007f]/u.test(value);
}
export function usableFirebaseUid(value) {
  const uid = String(value ?? "").trim();
  return uid.length > 0 && uid.length <= 128 ? uid : null;
}
export function emptyAdminAuthMetadata(state) {
  return {
    state,
    uid: null,
    email: null,
    emailVerified: null,
    disabled: null,
    creationTime: null,
    lastSignInTime: null,
    providers: [],
  };
}
export function sanitizeAdminAuthRecord(record) {
  return {
    state: "available",
    uid: String(record.uid),
    email: typeof record.email === "string" ? record.email : null,
    emailVerified: record.emailVerified === true,
    disabled: record.disabled === true,
    creationTime:
      typeof record.metadata?.creationTime === "string" ? record.metadata.creationTime : null,
    lastSignInTime:
      typeof record.metadata?.lastSignInTime === "string" ? record.metadata.lastSignInTime : null,
    providers: [
      ...new Set(
        Array.isArray(record.providerData)
          ? record.providerData
              .map((provider) => String(provider?.providerId ?? "").trim())
              .filter(Boolean)
          : [],
      ),
    ].sort(),
  };
}
export function authMismatchWarnings(user, auth) {
  if (auth.state !== "available") return [];
  const warnings = [];
  if (user.uid && auth.uid && user.uid !== auth.uid)
    warnings.push("The RTDB UID does not match the Firebase Authentication UID.");
  const appEmail = String(user.email ?? "")
      .trim()
      .toLowerCase(),
    authEmail = String(auth.email ?? "")
      .trim()
      .toLowerCase();
  if (appEmail && authEmail && appEmail !== authEmail)
    warnings.push("The RTDB email does not match the Firebase Authentication email.");
  return warnings;
}
export function buildAdminUserDetail(user, privileges, actor) {
  const role = user.role ?? "",
    definition = administratorRoleDefinition(role),
    privilegeKey = definition?.privilegeKey ?? null,
    roleIsMapped =
      privilegeKey !== null &&
      privileges.some((record) => Object.hasOwn(record.roleValues, privilegeKey));
  const actorUid = String(actor.uid ?? "").trim(),
    actorEmail = String(actor.email ?? "")
      .trim()
      .toLowerCase(),
    userEmail = String(user.email ?? "")
      .trim()
      .toLowerCase();
  const identityMatch =
      actorUid && user.uid
        ? user.uid === actorUid
          ? "uid"
          : "none"
        : actorEmail && userEmail === actorEmail
          ? "email"
          : "none",
    warnings = [];
  if (user.malformed) warnings.push("This legacy record is not stored as a normal user object.");
  if (!user.uid) warnings.push("No Firebase UID is stored on this application profile.");
  if (!user.email) warnings.push("No email address is stored on this application profile.");
  if (!user.role) warnings.push("No role is stored on this application profile.");
  else if (!definition)
    warnings.push(`Role "${user.role}" is outside the centralized role contract.`);
  else if (definition.legacy) warnings.push(`Role "${user.role}" is legacy and read-only.`);
  else if (definition.privilegeOnly)
    warnings.push(`Role "${user.role}" is a privilege-only value and cannot be assigned.`);
  else if (!roleIsMapped)
    warnings.push(`Role "${user.role}" has no matching strict privilege field.`);
  if (!user.status) warnings.push("No account status is stored on this application profile.");
  else if (user.status !== "Active" && user.status !== "Not Active")
    warnings.push(`Status "${user.status}" is outside the supported administrative values.`);
  return {
    user,
    warnings,
    currentAdministrator: identityMatch !== "none",
    identityMatch,
    finalAdministratorProtectionAppliesAtWrite:
      user.role === "super_admin" && user.status?.toLowerCase() === "active",
    privilegeContract: !role ? "unknown_role" : roleIsMapped ? "mapped" : "user_only_role",
    mappedPrivilegeKey: privilegeKey,
    roleContractState: administratorRoleContractState(role),
    privileges: privileges.map((record) => ({
      key: record.key,
      pageName: record.page_name,
      path: record.path,
      category: record.category,
      parent: record.parent,
      enabled:
        privilegeKey && Object.hasOwn(record.roleValues, privilegeKey)
          ? record.roleValues[privilegeKey] === true
          : null,
    })),
  };
}
import {
  administratorRoleContractState,
  administratorRoleDefinition,
} from "./administrator-role-contract.mjs";
