import type { RawAssignmentSnapshotEntry } from "./assignment-types";
import type { AssignmentDashboardFilters } from "./assignment-dashboard-contract";
import * as runtime from "./assignment-dashboard-metrics.mjs";

export interface DashboardPoint { label: string; value: number; }
export interface DashboardPerson {
  name: string; total: number; completed: number; active: number; paused: number;
  revisited: number; averageCompletionMs: number | null; completionRate: number;
  accepted?: number; averageResponseMs?: number | null;
}
export interface AssignmentDashboardData {
  filteredCount: number;
  slaSummary: DashboardPoint[];
  agingBuckets: DashboardPoint[];
  kpis: Record<string, number | null>;
  dailyAssignments: DashboardPoint[]; dailyCompleted: DashboardPoint[];
  weeklyCompleted: DashboardPoint[]; monthlyCompleted: DashboardPoint[];
  status: DashboardPoint[]; categories: DashboardPoint[];
  coordinators: DashboardPerson[]; riggers: DashboardPerson[];
  recentAssignments: RawAssignmentSnapshotEntry[];
  recentCompletions: RawAssignmentSnapshotEntry[];
  recentRevisits: RawAssignmentSnapshotEntry[];
}
export const assignmentDashboardTimestamp = runtime.assignmentDashboardTimestamp as (value: unknown) => number | null;
export const buildAssignmentDashboard = runtime.buildAssignmentDashboard as (
  records: RawAssignmentSnapshotEntry[], filters: AssignmentDashboardFilters, now?: Date,
) => AssignmentDashboardData;
