import * as runtime from "./assignment-dashboard-contract.mjs";

export type AssignmentDashboardPreset = "today" | "week" | "month" | "last30" | "custom";
export interface AssignmentDashboardFilters {
  preset: AssignmentDashboardPreset;
  startDate: string;
  endDate: string;
  coordinator: string;
  rigger: string;
  category: string;
  status: string;
  keyword: string;
  error: string | null;
}
export type AssignmentDashboardSearchParams = Record<string, string | string[] | undefined>;
export const ASSIGNMENT_DASHBOARD_MAX_RECORDS = runtime.ASSIGNMENT_DASHBOARD_MAX_RECORDS as number;
export const ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS = runtime.ASSIGNMENT_DASHBOARD_MAX_RANGE_DAYS as number;
export const ASSIGNMENT_DASHBOARD_PRESETS = runtime.ASSIGNMENT_DASHBOARD_PRESETS as readonly AssignmentDashboardPreset[];
export const ASSIGNMENT_DASHBOARD_STATUSES = runtime.ASSIGNMENT_DASHBOARD_STATUSES as readonly string[];
export const dashboardPresetDates = runtime.dashboardPresetDates as (preset: AssignmentDashboardPreset, now?: Date) => { startDate: string; endDate: string };
export const parseAssignmentDashboardParams = runtime.parseAssignmentDashboardParams as (input: AssignmentDashboardSearchParams, now?: Date) => AssignmentDashboardFilters;
