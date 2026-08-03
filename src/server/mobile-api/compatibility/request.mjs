export function readLegacyQuery(request) {
  const values = {};
  for (const key of new Set(request.nextUrl.searchParams.keys())) {
    const all = request.nextUrl.searchParams.getAll(key);
    values[key] = all.length > 1 ? all : all[0];
  }
  return values;
}

export async function readLegacyJsonBody(request) {
  try {
    return { ok: true, value: await request.json() };
  } catch (error) {
    return { ok: false, error };
  }
}

export function getLegacyInput(query, body, name, options = {}) {
  const hasQuery = Object.prototype.hasOwnProperty.call(query ?? {}, name);
  const hasBody = Object.prototype.hasOwnProperty.call(body ?? {}, name);
  if (options.precedence === "query") {
    if (hasQuery) return query[name];
    if (hasBody) return body[name];
  } else {
    if (hasBody) return body[name];
    if (hasQuery) return query[name];
  }
  return options.defaultValue;
}

export function preserveLegacyValue(value, fallback) {
  return value === undefined ? fallback : value;
}

export function getLegacyString(value, options = {}) {
  if (value === undefined || value === null) return value;
  let result = String(value);
  if (options.first && Array.isArray(value)) result = String(value[0]);
  if (options.trim) result = result.trim();
  if (options.case === "lower") result = result.toLowerCase();
  if (options.case === "upper") result = result.toUpperCase();
  return result;
}

export const getLegacyNumberLike = (value) => value;
export const getLegacyBooleanLike = (value) => value;
