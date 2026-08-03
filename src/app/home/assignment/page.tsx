import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseAssignmentListParams, type AssignmentSearchParams } from "@/features/assignment/assignment-list-params";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { AssignmentPageClient } from "@/components/assignment/assignment-page-client";

export const dynamic = "force-dynamic";

export default async function HomeAssignmentPage({ searchParams }: { searchParams: Promise<AssignmentSearchParams> }) {
  const user = await resolveAuthenticatedUser();
  if (!canAccessAssignment(user.privilege, user.role)) return <AssignmentDenied />;
  let query;
  try {
    query = parseAssignmentListParams(await searchParams);
  } catch {
    return <InvalidFilters />;
  }
  let rows;
  try {
    rows = await new FirebaseAssignmentReadRepository().list(query);
  } catch {
    throw new Error("Assignment repository unavailable.");
  }
  return <AssignmentPageClient rows={rows} query={query} />;
}

function AssignmentDenied() {
  return <section aria-labelledby="permission-denied" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 id="permission-denied" className="text-xl font-semibold text-amber-950">Permission denied</h1><p className="mt-2 text-sm text-amber-800">Your role does not have access to the Assignment list.</p></section>;
}

function InvalidFilters() {
  return <section aria-labelledby="invalid-filters" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 id="invalid-filters" className="text-xl font-semibold text-red-950">Invalid filters</h1><p className="mt-2 text-sm text-red-800">Review the URL filters and try again. Only one business filter can be active.</p></section>;
}
