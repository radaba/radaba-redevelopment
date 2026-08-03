import { ASSIGNMENT_DASHBOARD_MAX_RECORDS, type AssignmentDashboardFilters } from "@/features/assignment/assignment-dashboard-contract";
import { buildAssignmentDashboard } from "@/features/assignment/assignment-dashboard-metrics";
import type { AssignmentDashboardRepository } from "./assignment-dashboard-repository";

export class AssignmentDashboardService {
  constructor(private readonly repository: AssignmentDashboardRepository, private readonly now = () => new Date()) {}
  async read(filters: AssignmentDashboardFilters) {
    const result = await this.repository.readCreatedRange(filters.startDate, filters.endDate, ASSIGNMENT_DASHBOARD_MAX_RECORDS);
    const dashboard = buildAssignmentDashboard(result.records, filters, this.now());
    const matchingKeys = new Set([
      ...dashboard.recentAssignments,
      ...dashboard.recentCompletions,
      ...dashboard.recentRevisits,
    ].map((entry) => entry.key));
    const matching = result.records.filter((entry) => matchingKeys.has(entry.key));
    const recentActivity = await this.repository.readRecentActivity(matching, 10);
    return { ...dashboard, recentActivity, exceededLimit: result.exceededLimit };
  }
}
