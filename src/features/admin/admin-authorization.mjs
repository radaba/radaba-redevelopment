export const ADMINISTRATOR_ROLE = 'super_admin';
export const ADMINISTRATOR_PRIVILEGE_PATH = '/privilege';

export function canAdministrate(user) {
  if (!user || user.role !== ADMINISTRATOR_ROLE || String(user.status).toLowerCase() !== 'active') return false;
  const privileges = Array.isArray(user.privilege)
    ? user.privilege
    : Object.values(user.privilege ?? {});
  return privileges.some((record) =>
    record &&
    record.path === ADMINISTRATOR_PRIVILEGE_PATH &&
    record[ADMINISTRATOR_ROLE] === true);
}
