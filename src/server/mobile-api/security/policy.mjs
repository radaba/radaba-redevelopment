const lower = (value) => typeof value === "string" ? value.toLowerCase() : "";
const same = (left, right) => Boolean(lower(left)) && lower(left) === lower(right);
const role = (profile, value) =>
  same(profile?.role, value) || same(profile?.position, value);

export const MOBILE_ROUTE_POLICIES = Object.freeze({
  signin: { access: "public" },
  resetPassword: { access: "public" },
  getCurrentTime: { access: "public" },
  getRejectDropReasonList: { access: "public" },
  getUtility: { access: "public" },
  signout: { access: "authenticated" },
  getassignmentsById: { access: "assignment", id: "query:assignment_id" },
  getCellDetails: { access: "assignment", id: "query:assignment_id" },
  getImageDetails: { access: "assignment", id: "query:assignment_id" },
  getAorSummaryById: { access: "assignment", id: "query:assignment_id" },
  getCellDetailsPerSector: { access: "cell", id: "query:rcell_id" },
  updateUserDetails: { access: "profile", id: "query:email" },
  updateAssignmentDetails: { access: "assignment", id: "body:assignment_id" },
  updateImageDetails: { access: "assignment", id: "body:assignment_id" },
  updateCellDetails: {
    access: "cell-write",
    id: "body:rcell_id",
    assignment: "body:assignment_id",
  },
});

export function canAccessAssignment(profile, assignment) {
  if (role(profile, "Administrator")) return { allowed: true, reason: "administrator" };
  if (same(profile?.email, assignment?.rigger_email)) {
    return { allowed: true, reason: "assignment_owner" };
  }
  const coordinator = role(profile, "Coordinator") || role(profile, "RNO");
  if (coordinator && (
    same(profile?.email, assignment?.coordinator_email) ||
    same(profile?.email, assignment?.rno_email)
  )) return { allowed: true, reason: "related_coordinator" };
  return { allowed: false, reason: "ownership_mismatch" };
}

export function isAdministrator(profile) {
  return role(profile, "Administrator");
}

export function sameIdentity(left, right) {
  return same(left, right);
}
