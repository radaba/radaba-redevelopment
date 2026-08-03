export class AdminCommandPolicyError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const ADMIN_ROLE = 'super_admin';
const ADMIN_PATH = '/privilege';
const STATUSES = new Set(['Active', 'Not Active']);

export class AdminCommandPolicy {
  constructor(repository) {
    this.repository = repository;
  }

  async updateUserRole({ targetUserKey, role, previousRole }) {
    if (typeof role !== 'string' || typeof previousRole !== 'string') throw new AdminCommandPolicyError('MALFORMED', 'Role values are required.');
    const [target, roles] = await Promise.all([this.repository.findUser(targetUserKey), this.repository.supportedRoles()]);
    if (!target) throw new AdminCommandPolicyError('NOT_FOUND', 'User was not found.');
    if (!roles.includes(role)) throw new AdminCommandPolicyError('INVALID_VALUE', 'Role is not supported.');
    if (target.role !== previousRole) throw new AdminCommandPolicyError('CONFLICT', 'Stale role.');
    if (target.role === ADMIN_ROLE && role !== ADMIN_ROLE && String(target.status).toLowerCase() === 'active' &&
      await this.repository.countActiveAdministrators() <= 1) throw new AdminCommandPolicyError('CONFLICT', 'Final administrator.');
    await this.repository.updateUserRoleField(targetUserKey, role);
  }

  async updateUserStatus({ targetUserKey, status, previousStatus }) {
    if (typeof status !== 'string' || typeof previousStatus !== 'string') throw new AdminCommandPolicyError('MALFORMED', 'Status values are required.');
    if (!STATUSES.has(status)) throw new AdminCommandPolicyError('INVALID_VALUE', 'Status is not supported.');
    const target = await this.repository.findUser(targetUserKey);
    if (!target) throw new AdminCommandPolicyError('NOT_FOUND', 'User was not found.');
    if (target.status !== previousStatus) throw new AdminCommandPolicyError('CONFLICT', 'Stale status.');
    if (target.role === ADMIN_ROLE && status === 'Not Active' && String(target.status).toLowerCase() === 'active' &&
      await this.repository.countActiveAdministrators() <= 1) throw new AdminCommandPolicyError('CONFLICT', 'Final administrator.');
    await this.repository.updateUserStatusField(targetUserKey, status);
  }

  async updatePrivilegeForRole({ privilegeKey, role, enabled, previousValue }) {
    if (typeof role !== 'string' || typeof enabled !== 'boolean' || typeof previousValue !== 'boolean') {
      throw new AdminCommandPolicyError('MALFORMED', 'Strict boolean values are required.');
    }
    const [record, roles] = await Promise.all([this.repository.findPrivilege(privilegeKey), this.repository.supportedRoles()]);
    if (!record) throw new AdminCommandPolicyError('NOT_FOUND', 'Privilege was not found.');
    if (!roles.includes(role) || !Object.hasOwn(record.roleValues, role)) throw new AdminCommandPolicyError('INVALID_VALUE', 'Unknown role.');
    if (record.roleValues[role] !== previousValue) throw new AdminCommandPolicyError('CONFLICT', 'Stale privilege.');
    if (record.path === ADMIN_PATH && role === ADMIN_ROLE && enabled === false) {
      const remaining = (await this.repository.listPrivileges()).some((candidate) =>
        candidate.key !== record.key && candidate.path === ADMIN_PATH && candidate.roleValues[ADMIN_ROLE] === true);
      if (!remaining) throw new AdminCommandPolicyError('CONFLICT', 'Final administrator access.');
    }
    await this.repository.updatePrivilegeRoleField(privilegeKey, role, enabled);
  }
}
