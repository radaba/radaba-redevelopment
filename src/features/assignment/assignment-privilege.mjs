export function canAccessAssignment(privileges, role) {
  if (!role || !privileges) return false;
  const records = Array.isArray(privileges) ? privileges : Object.values(privileges);
  return records.some((record) => record && record.path === '/assignment' && record[role] === true);
}
