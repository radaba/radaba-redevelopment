export const TOWER_PAGE_SIZES = [25, 50, 100];
export const TOWER_SCAN_LIMIT = 500;
const keys = ["region", "subRegion", "province", "kabupaten", "cluster", "siteType", "btsType"];
export function parseTowerQuery(input = {}) {
  const one = (name) => Array.isArray(input[name]) ? input[name][0] : input[name];
  const pageSize = Number(one("pageSize") || 25);
  if (!TOWER_PAGE_SIZES.includes(pageSize)) throw new Error("Invalid page size.");
  const clean = (name, maximum = 120) => {
    const value = String(one(name) || "").trim();
    if (value.length > maximum) throw new Error(`Invalid ${name}.`);
    return value;
  };
  const cursor = clean("cursor", 160);
  if (cursor && !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error("Invalid cursor.");
  return {
    q: clean("q"),
    ...Object.fromEntries(keys.map((key) => [key, clean(key)])),
    pageSize,
    cursor: cursor || null,
  };
}

