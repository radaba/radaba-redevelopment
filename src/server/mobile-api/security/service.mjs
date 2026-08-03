import { validateMobileIdentifier } from "./identifier.mjs";
import {
  canAccessAssignment,
  isAdministrator,
  sameIdentity,
} from "./policy.mjs";

const KNOWN_ROLES = new Set(["Rigger", "Coordinator", "RNO", "Administrator"]);
const validEmailIdentity = (value) => typeof value === "string" && value.length > 0 && value.length <= 254 && value === value.trim() && !/[#$[\]/\u0000-\u001f\u007f]/u.test(value);

function verifierReason(error) {
  const code = String(error?.code || "");
  if (code.includes("expired")) return "expired_token";
  if (code.includes("revoked")) return "revoked_token";
  if (code.includes("argument") || code.includes("format")) return "malformed_token";
  return "invalid_token";
}

function deny(reason, details = {}) {
  return { allowed: false, reason, ...details };
}

function valueAt(input, locator) {
  if (!locator) return undefined;
  const [place, key] = locator.split(":");
  return input[place]?.[key];
}

async function resolvePrincipal(token, verifier, repository) {
  let claims;
  try {
    claims = await verifier.verify(token);
  } catch (error) {
    return deny(verifierReason(error));
  }
  const uid = typeof claims?.uid === "string" ? claims.uid : claims?.sub;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : "";
  if (!uid) return deny("invalid_token");
  let users = await repository.findUsersByUid(uid);
  if (users.length === 0 && email) users = await repository.findUsersByEmail(email);
  if (users.length === 0) return deny("unknown_user", { uid });
  if (users.length !== 1) return deny("duplicate_user", { uid });
  const profile = users[0].value;
  if (profile.uid && profile.uid !== uid) return deny("identity_mismatch", { uid });
  if (email && profile.email && !sameIdentity(profile.email, email)) {
    return deny("identity_mismatch", { uid });
  }
  if (profile.disabled === true) return deny("disabled_user", { uid });
  if (profile.status !== "Active") return deny("inactive_user", { uid });
  if (!KNOWN_ROLES.has(String(profile.role || profile.position || ""))) {
    return deny("role_mismatch", { uid });
  }
  return { allowed: true, uid, email, profile };
}

async function assignmentDecision(input, principal, repository, assignmentId) {
  const valid = validateMobileIdentifier(assignmentId);
  if (!valid.valid) return deny(valid.reason, { uid: principal.uid, objectId: assignmentId });
  const assignments = await repository.findAssignmentsById(assignmentId);
  if (assignments.length === 0) {
    return deny("object_not_found", { uid: principal.uid, objectId: assignmentId });
  }
  if (assignments.length !== 1) {
    return deny("duplicate_assignment", { uid: principal.uid, objectId: assignmentId });
  }
  const assignment = assignments[0].value;
  const access = canAccessAssignment(principal.profile, assignment);
  if (!access.allowed) return deny(access.reason, { uid: principal.uid, objectId: assignmentId });
  const suppliedRigger = input.body?.rigger_email;
  if (suppliedRigger !== undefined && !sameIdentity(suppliedRigger, assignment.rigger_email)) {
    return deny("identity_spoofing", { uid: principal.uid, objectId: assignmentId });
  }
  return {
    allowed: true,
    reason: access.reason,
    uid: principal.uid,
    objectId: assignmentId,
    assignment,
  };
}

export function createMobileSecurityService({ verifier, repository }) {
  return {
    async evaluate(policy, tokenResult, input) {
      if (policy.access === "public") return { allowed: true, reason: "public" };
      if (!tokenResult.ok) return deny(tokenResult.reason);
      const principal = await resolvePrincipal(tokenResult.token, verifier, repository);
      if (!principal.allowed) return principal;
      if (policy.access === "authenticated") return principal;
      if (policy.access === "profile") {
        const email = valueAt(input, policy.id);
        const valid = validEmailIdentity(email);
        if (!valid) return deny("unsafe_identifier", { uid: principal.uid, objectId: email });
        return isAdministrator(principal.profile) || sameIdentity(principal.profile.email, email)
          ? { ...principal, reason: isAdministrator(principal.profile) ? "administrator" : "self", objectId: email }
          : deny("identity_spoofing", { uid: principal.uid, objectId: email });
      }
      if (policy.access === "assignment") {
        return assignmentDecision(
          input, principal, repository, valueAt(input, policy.id),
        );
      }
      const rcellId = valueAt(input, policy.id);
      const validCell = validateMobileIdentifier(rcellId);
      if (!validCell.valid) return deny(validCell.reason, { uid: principal.uid, objectId: rcellId });
      const cells = await repository.findCellsByRcellId(rcellId);
      let assignmentId = policy.access === "cell-write"
        ? valueAt(input, policy.assignment)
        : cells[0]?.value?.assignment_id;
      if (policy.access === "cell-write") {
        const validAssignment = validateMobileIdentifier(assignmentId);
        if (!validAssignment.valid) {
          return deny(validAssignment.reason, { uid: principal.uid, objectId: rcellId });
        }
        if (cells.some((row) => row.value.assignment_id &&
          !sameIdentity(row.value.assignment_id, assignmentId))) {
          return deny("cross_object_access", { uid: principal.uid, objectId: rcellId });
        }
        if (cells.length === 0 && !String(rcellId).endsWith(`_${assignmentId}`)) {
          return deny("cross_object_access", { uid: principal.uid, objectId: rcellId });
        }
      } else if (cells.length === 0) {
        return deny("object_not_found", { uid: principal.uid, objectId: rcellId });
      } else if (cells.some((row) => !sameIdentity(row.value.assignment_id, assignmentId))) {
        return deny("cross_object_access", { uid: principal.uid, objectId: rcellId });
      }
      const decision = await assignmentDecision(input, principal, repository, assignmentId);
      return decision.allowed ? { ...decision, objectId: rcellId } : decision;
    },
  };
}
