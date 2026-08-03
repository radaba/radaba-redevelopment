export const ASSIGNMENT_DASHBOARD_MAX_RECORDS = 5000;
export const ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS = 366;
export const ASSIGNMENT_DASHBOARD_PRESETS = Object.freeze(["today", "week", "month", "last30", "custom"]);
export const ASSIGNMENT_DASHBOARD_STATUSES = Object.freeze(["Open", "Accepted", "On Progress", "Paused", "Finished", "Rejected", "Dropped"]);

const first = (value) => Array.isArray(value) ? value[0] : value;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const day = 86400000;
const isoDate = (date) => date.toISOString().slice(0, 10);

export function dashboardPresetDates(preset, now = new Date()) {
  const current = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let start = new Date(current);
  if (preset === "week") start.setUTCDate(current.getUTCDate() - ((current.getUTCDay() + 6) % 7));
  else if (preset === "month") start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1));
  else if (preset === "last30") start.setUTCDate(current.getUTCDate() - 29);
  return { startDate: isoDate(start), endDate: isoDate(current) };
}

export function parseAssignmentDashboardParams(input, now = new Date()) {
  const requestedPreset = String(first(input.preset) ?? "last30");
  const preset = ASSIGNMENT_DASHBOARD_PRESETS.includes(requestedPreset) ? requestedPreset : "last30";
  const defaults = dashboardPresetDates(preset === "custom" ? "last30" : preset, now);
  let startDate = String(first(input.startDate) ?? defaults.startDate);
  let endDate = String(first(input.endDate) ?? defaults.endDate);
  let error = null;
  if (!datePattern.test(startDate) || !datePattern.test(endDate) || startDate > endDate) {
    ({ startDate, endDate } = defaults);
    error = "Invalid date range.";
  } else {
    const span = (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / day + 1;
    if (span > ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS) {
      ({ startDate, endDate } = defaults);
      error = "Date range cannot exceed one year.";
    }
  }
  const text = (key, maximum = 200) => String(first(input[key]) ?? "").trim().slice(0, maximum);
  const status = text("status");
  return {
    preset, startDate, endDate,
    coordinator: text("coordinator"),
    rigger: text("rigger"),
    category: text("category"),
    status: ASSIGNMENT_DASHBOARD_STATUSES.includes(status) ? status : "",
    keyword: text("keyword"),
    error,
  };
}
