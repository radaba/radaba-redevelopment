export const ADMIN_USER_SORTS = ["name", "email", "role", "status", "company", "region"];
export const ADMIN_USER_PAGE_SIZES = [25, 50, 100];
const first = (value) => Array.isArray(value) ? value[0] : value;
const clean = (value) => typeof first(value) === "string" ? first(value).trim() : "";
const positiveInteger = (value, fallback) => { const parsed = Number.parseInt(clean(value), 10); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback; };
export function parseAdminUserListParams(params = {}) {
  const sort = clean(params.sort); const pageSize = positiveInteger(params.pageSize, 25);
  return { query: clean(params.q).slice(0, 100), role: clean(params.role), status: clean(params.status), company: clean(params.company), region: clean(params.region), sort: ADMIN_USER_SORTS.includes(sort) ? sort : "name", direction: clean(params.direction) === "desc" ? "desc" : "asc", page: positiveInteger(params.page, 1), pageSize: ADMIN_USER_PAGE_SIZES.includes(pageSize) ? pageSize : 25 };
}
const normalized = (value) => String(value ?? "").trim().toLocaleLowerCase("en-US");
const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
function matches(user, params) {
  if (params.role && user.role !== params.role || params.status && user.status !== params.status || params.company && user.company !== params.company || params.region && user.region !== params.region) return false;
  if (!params.query) return true; const needle = normalized(params.query);
  return [user.name, user.email, user.uid, user.role, user.status, user.company, user.region].some((value) => normalized(value).includes(needle));
}
export function buildAdminUserList(users, requestedParams = {}) {
  const params = parseAdminUserListParams(requestedParams); const direction = params.direction === "desc" ? -1 : 1;
  const filtered = users.filter((user) => matches(user, params)).sort((left, right) => { const primary = compareText(normalized(left[params.sort]), normalized(right[params.sort])); return primary === 0 ? compareText(String(left.key), String(right.key)) : primary * direction; });
  const pageCount = Math.max(1, Math.ceil(filtered.length / params.pageSize)); const page = Math.min(params.page, pageCount); const start = (page - 1) * params.pageSize;
  return { users: filtered.slice(start, start + params.pageSize), params: { ...params, page }, totalCount: users.length, filteredCount: filtered.length, pageCount, rangeStart: filtered.length ? start + 1 : 0, rangeEnd: Math.min(start + params.pageSize, filtered.length) };
}
export function adminUserFilterOptions(users) { const values = (field) => [...new Set(users.map((user) => user[field]).filter(Boolean))].sort((left, right) => compareText(normalized(left), normalized(right))); return { companies: values("company"), regions: values("region") }; }
