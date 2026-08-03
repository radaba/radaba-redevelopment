import { isCompletedAssignment } from "./assignment-command-contract.mjs";
import { evaluateAssignmentSla } from "./assignment-sla-contract.mjs";

const wallTime = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/;
export function assignmentDashboardTimestamp(value) {
  const match = String(value ?? "").trim().match(wallTime);
  if (!match) return null;
  return Date.UTC(+match[1], +match[2] - 1, +match[3], +(match[4] ?? 0), +(match[5] ?? 0), +(match[6] ?? 0));
}
const text = (value) => String(value ?? "").trim();
const date = (value) => text(value).slice(0, 10);
const lower = (value) => text(value).toLowerCase();
const average = (values) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
const group = (records, field) => {
  const counts = new Map();
  for (const record of records) {
    const label = text(record[field]) || "Unassigned";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};
const buckets = (startDate, endDate) => {
  const result = [];
  for (let current = Date.parse(`${startDate}T00:00:00Z`), end = Date.parse(`${endDate}T00:00:00Z`); current <= end; current += 86400000)
    result.push({ label: new Date(current).toISOString().slice(0, 10), value: 0 });
  return result;
};
const trend = (records, startDate, endDate, field) => {
  const result = buckets(startDate, endDate), map = new Map(result.map((item) => [item.label, item]));
  for (const record of records) {
    const item = map.get(date(record[field]));
    if (item) item.value += 1;
  }
  return result;
};
const duration = (record, start, end) => {
  const left = assignmentDashboardTimestamp(record[start]), right = assignmentDashboardTimestamp(record[end]);
  return left !== null && right !== null && right >= left ? right - left : null;
};
const matches = (record, filters) => {
  if (filters.coordinator && lower(record.coordinator_name) !== lower(filters.coordinator)) return false;
  if (filters.rigger && lower(record.rigger_name) !== lower(filters.rigger)) return false;
  if (filters.category && lower(record.assignment_category) !== lower(filters.category)) return false;
  if (filters.status && lower(record.assignment_state) !== lower(filters.status)) return false;
  if (filters.keyword) {
    const haystack = ["assignment_id", "tower_id", "sitename", "assignment_description", "coordinator_name", "rigger_name"]
      .map((field) => lower(record[field])).join(" ");
    if (!haystack.includes(lower(filters.keyword))) return false;
  }
  return true;
};
const weekKey = (label) => {
  const value = new Date(`${label}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - ((value.getUTCDay() + 6) % 7));
  return value.toISOString().slice(0, 10);
};
const monthKey = (label) => label.slice(0, 7);
const rollup = (daily, key) => {
  const values = new Map();
  for (const item of daily) values.set(key(item.label), (values.get(key(item.label)) ?? 0) + item.value);
  return [...values].map(([label, value]) => ({ label, value }));
};

export function buildAssignmentDashboard(records, filters, now = new Date()) {
  const filtered = records.filter((record) => matches(record.value ?? record, filters));
  const values = filtered.map((record) => record.value ?? record);
  const sla = values.map((record) => evaluateAssignmentSla(record, now));
  const completed = values.filter(isCompletedAssignment);
  const active = values.filter((record) => !isCompletedAssignment(record) && !["Rejected", "Dropped"].includes(text(record.assignment_state)));
  const today = now.toISOString().slice(0, 10);
  const startOfWeek = weekKey(today);
  const startOfMonth = today.slice(0, 7);
  const completionTimes = completed.map((record) => duration(record, "created_datetime", "completed_datetime")).filter((value) => value !== null);
  const responseTimes = values.map((record) => duration(record, "created_datetime", "accepted_datetime")).filter((value) => value !== null);
  const ages = active.map((record) => {
    const created = assignmentDashboardTimestamp(record.created_datetime);
    return created === null || now.getTime() < created ? null : now.getTime() - created;
  }).filter((value) => value !== null);
  const status = group(values, "assignment_state");
  const dailyAssignments = trend(values, filters.startDate, filters.endDate, "created_date");
  const dailyCompleted = trend(values, filters.startDate, filters.endDate, "completed_date");
  const workload = (field) => group(values, field).map((item) => {
    const personRecords = values.filter((record) => (text(record[field]) || "Unassigned") === item.label);
    const personCompleted = personRecords.filter(isCompletedAssignment);
    const durations = personCompleted.map((record) => duration(record, "created_datetime", "completed_datetime")).filter((value) => value !== null);
    return {
      name: item.label, total: personRecords.length, completed: personCompleted.length,
      active: personRecords.filter((record) => !isCompletedAssignment(record)).length,
      paused: personRecords.filter((record) => text(record.assignment_state) === "Paused").length,
      revisited: personRecords.filter((record) => Number(record.revisit_count ?? 0) > 0).length,
      averageCompletionMs: average(durations),
      completionRate: personRecords.length ? Math.round(personCompleted.length / personRecords.length * 1000) / 10 : 0,
    };
  });
  return {
    filteredCount: values.length,
    slaSummary: ["On Track", "Warning", "Overdue", "Escalated", "Unavailable"]
      .map((label) => ({ label, value: sla.filter((item) => item.state === label).length })),
    agingBuckets: ["0-1", "2-3", "4-7", "8-14", "15+"]
      .map((label) => ({ label, value: sla.filter((item) => item.agingBucket === label).length })),
    kpis: {
      total: values.length,
      open: values.filter((record) => text(record.assignment_state) === "Open").length,
      accepted: values.filter((record) => text(record.assignment_state) === "Accepted").length,
      onProgress: values.filter((record) => text(record.assignment_state) === "On Progress").length,
      paused: values.filter((record) => text(record.assignment_state) === "Paused").length,
      completedToday: completed.filter((record) => date(record.completed_datetime) === today).length,
      completedThisWeek: completed.filter((record) => date(record.completed_datetime) >= startOfWeek && date(record.completed_datetime) <= today).length,
      completedThisMonth: completed.filter((record) => date(record.completed_datetime).startsWith(startOfMonth)).length,
      revisited: values.filter((record) => Number(record.revisit_count ?? 0) > 0).length,
      averageCompletionMs: average(completionTimes),
      averageResponseMs: average(responseTimes),
      averageAgeMs: average(ages),
      averagePauseMs: null,
    },
    dailyAssignments, dailyCompleted,
    weeklyCompleted: rollup(dailyCompleted, weekKey),
    monthlyCompleted: rollup(dailyCompleted, monthKey),
    status, categories: group(values, "assignment_category"),
    coordinators: workload("coordinator_name"),
    riggers: workload("rigger_name").map((item) => ({
      ...item,
      accepted: values.filter((record) => (text(record.rigger_name) || "Unassigned") === item.name && ["Accepted", "On Progress", "Paused", "Finished"].includes(text(record.assignment_state))).length,
      averageResponseMs: average(values.filter((record) => (text(record.rigger_name) || "Unassigned") === item.name).map((record) => duration(record, "created_datetime", "accepted_datetime")).filter((value) => value !== null)),
    })),
    recentAssignments: [...filtered].sort((a, b) => text(b.value?.created_datetime).localeCompare(text(a.value?.created_datetime)) || text(a.key).localeCompare(text(b.key))).slice(0, 8),
    recentCompletions: [...filtered].filter((entry) => text(entry.value?.completed_datetime)).sort((a, b) => text(b.value.completed_datetime).localeCompare(text(a.value.completed_datetime)) || text(a.key).localeCompare(text(b.key))).slice(0, 8),
    recentRevisits: [...filtered].filter((entry) => text(entry.value?.last_revisit_at)).sort((a, b) => text(b.value.last_revisit_at).localeCompare(text(a.value.last_revisit_at)) || text(a.key).localeCompare(text(b.key))).slice(0, 8),
  };
}
