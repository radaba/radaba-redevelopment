const allow = (policy) => ({ allowed: true, policy });
const deny = (policy, reason) => ({ allowed: false, policy, reason });

export const mobileAuthorizationPolicies = Object.freeze({
  authenticated(user) {
    return user ? allow("authenticated") : deny("authenticated", "missing_user");
  },
  activeRigger(user) {
    if (!user) return deny("active_rigger", "missing_user");
    return user.status === "Active"
      ? allow("active_rigger")
      : deny("active_rigger", "inactive_user");
  },
  assignmentOwner(user, assignment) {
    if (!user) return deny("assignment_owner", "missing_user");
    if (!assignment) return deny("assignment_owner", "missing_assignment");
    return user.email === assignment.rigger_email
      ? allow("assignment_owner")
      : deny("assignment_owner", "not_owner");
  },
  role(user, roles) {
    return user && roles.includes(user.role)
      ? allow("role")
      : deny("role", "role_not_allowed");
  },
  privilege(user, privilege) {
    const values = Array.isArray(user?.privilege) ? user.privilege : [];
    return values.includes(privilege)
      ? allow("privilege")
      : deny("privilege", "privilege_not_allowed");
  },
});
