const fields = [
  "tower_id", "site_id", "sitename", "site_type", "latitude", "longitude", "region", "sub_region",
  "province", "kabupaten", "kecamatan", "new_cluster_name", "bts_type", "antenna_system",
  "antenna_type", "g900", "g1800", "u900", "u2100", "l700", "l850", "l900", "l1800", "l2100", "l2300", "l2600",
];
const ignoredFields = new Set(["radaba_status"]);
const scalar = (value) =>
  value === null || ["string", "number", "boolean"].includes(typeof value) ? value : null;
export function mapTower(firebaseKey, raw = {}) {
  const mapped = { firebaseKey };
  for (const field of fields) mapped[field] = scalar(raw[field]);
  mapped.additionalFields = Object.fromEntries(
    Object.entries(raw)
      .filter(([key, value]) => !fields.includes(key) && !ignoredFields.has(key) && scalar(value) !== null)
      .map(([key, value]) => [key, scalar(value)]),
  );
  return mapped;
}
export const towerDisplay = (value) =>
  value === null || value === undefined || value === "" ? "—" : String(value);
export function towerCoordinates(tower) {
  const latitude = Number(tower.latitude);
  const longitude = Number(tower.longitude);
  return Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 &&
    Number.isFinite(longitude) && longitude >= -180 && longitude <= 180
    ? { latitude, longitude }
    : null;
}

