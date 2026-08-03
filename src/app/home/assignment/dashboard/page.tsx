import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseAssignmentDashboardParams, type AssignmentDashboardSearchParams } from "@/features/assignment/assignment-dashboard-contract";
import { AssignmentDashboardService } from "@/server/assignment/assignment-dashboard-service";
import { FirebaseAssignmentDashboardRepository } from "@/server/assignment/firebase-assignment-dashboard-repository";
import { AssignmentDashboard } from "@/components/assignment/assignment-dashboard";

export const dynamic = "force-dynamic";
const text = (value: unknown) => String(value ?? "").trim();
const recent = (entries: Array<{ key: string; value: Record<string, unknown> }>, at: string) => entries.map(({ key, value }) => ({
  key, assignmentId: text(value.assignment_id) || key, state: text(value.assignment_state),
  at: text(value[at]), person: text(value.rigger_name),
}));

export default async function AssignmentDashboardPage({ searchParams }: { searchParams: Promise<AssignmentDashboardSearchParams> }) {
  const user = await resolveAuthenticatedUser();
  if (!canAccessAssignment(user.privilege, user.role)) return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Permission denied</h1><p className="mt-2 text-sm">Assignment access is required to view analytics.</p></section>;
  const filters = parseAssignmentDashboardParams(await searchParams);
  const data = await new AssignmentDashboardService(new FirebaseAssignmentDashboardRepository()).read(filters);
  const options = {
    coordinators: data.coordinators.map((item) => item.name).filter((name) => name !== "Unassigned"),
    riggers: data.riggers.map((item) => item.name).filter((name) => name !== "Unassigned"),
    categories: data.categories.map((item) => item.label).filter((name) => name !== "Unassigned"),
  };
  const view = {
    ...data,
    recentAssignments: recent(data.recentAssignments, "created_datetime"),
    recentCompletions: recent(data.recentCompletions, "completed_datetime"),
    recentRevisits: recent(data.recentRevisits, "last_revisit_at"),
  };
  return <AssignmentDashboard filters={filters} data={view} options={options} />;
}
