import { notFound } from "next/navigation";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { mapRawAssignmentToDetail } from "@/features/assignment/assignment-detail";
import { mapRawAssignmentToListItem } from "@/features/assignment/assignment-mapper";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { AssignmentDetailView } from "@/components/assignment/assignment-detail";
import { canEditAssignmentExecution } from "@/features/assignment/assignment-execution-contract";
import { evaluateAssignmentSla } from "@/features/assignment/assignment-sla-contract";
import { mapAssignmentToReport } from "@/features/report/aor-report-contract";
import { RelatedReports } from "@/components/report/related-reports";
import { FirebaseAssignmentActivityRepository } from "@/server/assignment/firebase-assignment-activity-repository";
import { buildAssignmentActivityTimeline } from "@/features/assignment/assignment-timeline";

export const dynamic = "force-dynamic";

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await resolveAuthenticatedUser();
  if (!canAccessAssignment(user.privilege, user.role)) return <AssignmentDetailDenied />;

  const encodedKey = (await params).assignmentId;
  let assignmentKey: string;
  try {
    assignmentKey = decodeURIComponent(encodedKey);
  } catch {
    notFound();
  }
  if (!assignmentKey || /[.#$\[\]\/]/.test(assignmentKey)) notFound();

  const entry = await new FirebaseAssignmentReadRepository().findByKey(assignmentKey);
  if (!entry) notFound();
  if (process.env.NODE_ENV === "development")
    console.info("assignment_reassignment_trace", {
      pathname: `/home/assignment/${encodedKey}`,
      pageRouteParameter: encodedKey,
      repositoryLookupKey: assignmentKey,
      firebaseSnapshotKey: entry.key,
      recordAssignmentId: String(entry.value.assignment_id ?? ""),
      detailAssignmentKey: entry.key,
      detailAssignmentId: String(entry.value.assignment_id ?? ""),
    });

  const report = mapAssignmentToReport(entry.key, entry.value);
  const activity = await new FirebaseAssignmentActivityRepository().read(entry.key, entry.value);
  const activityEvents = buildAssignmentActivityTimeline(activity);
  const administrator = String(user.role).trim().toLowerCase() === "super_admin";
  return (
    <div className="space-y-4">
      <AssignmentDetailView
        detail={mapRawAssignmentToDetail(entry.key, entry.value)}
        row={mapRawAssignmentToListItem(entry.key, entry.value)}
        sla={evaluateAssignmentSla(entry.value)}
        showAdministratorDiagnostic={String(user.role).trim().toLowerCase() === "super_admin"}
        activityEvents={activityEvents}
        activityUnavailableSources={activity.unavailableSources}
        auditCenterHref={administrator ? `/home/admin/audit?module=assignment&q=${encodeURIComponent(entry.key)}` : null}
        canEditWorkExecution={canEditAssignmentExecution(entry.value, {
          uid: String(user.uid),
          name: String(user.name),
          email: String(user.email),
          role: String(user.role),
        })}
      />
      <RelatedReports
        reports={entry.value.report_name || entry.value.report_url ? [report] : []}
        title="AOR Reports"
      />
    </div>
  );
}

function AssignmentDetailDenied() {
  return (
    <section
      aria-labelledby="assignment-detail-denied"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
    >
      <h1 id="assignment-detail-denied" className="text-xl font-semibold text-amber-950">
        Permission denied
      </h1>
      <p className="mt-2 text-sm text-amber-800">
        Your role does not have access to Assignment details.
      </p>
    </section>
  );
}
