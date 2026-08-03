import {
  ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS,
  ASSIGNMENT_DASHBOARD_MAX_RECORDS,
  ASSIGNMENT_DASHBOARD_PRESETS,
  ASSIGNMENT_DASHBOARD_STATUSES,
  dashboardPresetDates,
} from "./assignment-dashboard-contract.mjs";

export const ASSIGNMENT_MAP_MAX_RECORDS = ASSIGNMENT_DASHBOARD_MAX_RECORDS;
export const ASSIGNMENT_MAP_MAX_RANGE_DAYS = ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS;
export const ASSIGNMENT_MAP_DEFAULT_CENTER = Object.freeze([117, -2]);
export const ASSIGNMENT_MAP_DEFAULT_ZOOM = 4;
export const ASSIGNMENT_MAP_SLA_STATES = Object.freeze([
  "On Track", "Warning", "Overdue", "Escalated", "Unavailable", "Not Applicable",
]);
export const ASSIGNMENT_MAP_COORDINATE_STATES = Object.freeze([
  "valid", "missing", "invalid", "possibly-reversed",
]);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;
const first = (value) => Array.isArray(value) ? value[0] : value;
const clean = (value, maximum = 200) => String(first(value) ?? "").trim().slice(0, maximum);

function coordinateValue(value) {
  if (value === null || value === undefined || typeof value === "boolean") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function normalizeAssignmentCoordinates(record) {
  const rawLatitude = record?.latitude;
  const rawLongitude = record?.longitude;
  const latitude = coordinateValue(rawLatitude);
  const longitude = coordinateValue(rawLongitude);
  if (latitude === null || longitude === null) {
    return {
      state: "missing", latitude: null, longitude: null,
      reason: latitude === null && longitude === null
        ? "Latitude and longitude are missing."
        : latitude === null ? "Latitude is missing." : "Longitude is missing.",
    };
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { state: "invalid", latitude: null, longitude: null, reason: "Coordinates are not numeric." };
  }
  const valid = latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  if (valid) return { state: "valid", latitude, longitude, reason: null };
  const reversed = longitude >= -90 && longitude <= 90 && latitude >= -180 && latitude <= 180;
  if (reversed) {
    return {
      state: "possibly-reversed", latitude: null, longitude: null,
      reason: "Latitude and longitude may be reversed.",
    };
  }
  return { state: "invalid", latitude: null, longitude: null, reason: "Coordinates are outside valid ranges." };
}

export function parseAssignmentMapParams(input = {}, now = new Date()) {
  const requestedPreset = clean(input.preset, 20) || "last30";
  const preset = ASSIGNMENT_DASHBOARD_PRESETS.includes(requestedPreset) ? requestedPreset : "last30";
  const defaults = dashboardPresetDates(preset === "custom" ? "last30" : preset, now);
  let startDate = clean(input.startDate, 10) || defaults.startDate;
  let endDate = clean(input.endDate, 10) || defaults.endDate;
  let error = null;
  const span = DATE_PATTERN.test(startDate) && DATE_PATTERN.test(endDate)
    ? (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / DAY + 1
    : Number.NaN;
  if (!Number.isFinite(span) || span < 1 || span > ASSIGNMENT_MAP_MAX_RANGE_DAYS) {
    ({ startDate, endDate } = defaults);
    error = "Invalid map date range.";
  }
  const status = clean(input.status, 40);
  const slaState = clean(input.slaState, 40);
  return {
    preset, startDate, endDate,
    coordinator: clean(input.coordinator, 100),
    rigger: clean(input.rigger, 100),
    category: clean(input.category, 100),
    region: clean(input.region, 100),
    status: ASSIGNMENT_DASHBOARD_STATUSES.includes(status) ? status : "",
    slaState: ASSIGNMENT_MAP_SLA_STATES.includes(slaState) ? slaState : "",
    keyword: clean(input.keyword),
    error,
  };
}

const lower = (value) => String(value ?? "").trim().toLowerCase();
export function matchesAssignmentMapFilters(record, sla, filters) {
  if (filters.coordinator && lower(record.coordinator_name) !== lower(filters.coordinator)) return false;
  if (filters.rigger && lower(record.rigger_name) !== lower(filters.rigger)) return false;
  if (filters.category && lower(record.assignment_category) !== lower(filters.category)) return false;
  if (filters.region && lower(record.region) !== lower(filters.region)) return false;
  if (filters.status && lower(record.assignment_state) !== lower(filters.status)) return false;
  if (filters.slaState && sla.state !== filters.slaState) return false;
  if (filters.keyword) {
    const haystack = [
      "assignment_id", "tower_id", "sitename", "new_cluster_name", "region", "sub_region",
      "province", "kabupaten", "kecamatan", "assignment_description",
    ].map((field) => lower(record[field])).join(" ");
    if (!haystack.includes(lower(filters.keyword))) return false;
  }
  return true;
}
