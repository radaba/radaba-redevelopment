import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseTowerQuery, type TowerSearchParams } from "@/features/tower/tower-query-contract";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseTowerReadRepository } from "@/server/tower/firebase-tower-repository";
import { TowerDirectory } from "@/components/tower/tower-directory";
import { canAdministrate } from "@/features/admin/admin-authorization";
export const dynamic = "force-dynamic";
export default async function TowersPage({ searchParams }: { searchParams: Promise<TowerSearchParams> }) {
  const user = await resolveAuthenticatedUser();
  if (String(user.status).toLowerCase() !== "active" || !canAccessAssignment(user.privilege, user.role))
    return <TowerDenied />;
  let query;
  try { query = parseTowerQuery(await searchParams); }
  catch { return <TowerInvalid />; }
  let result;
  try { result = await new FirebaseTowerReadRepository().list(query); }
  catch { throw new Error("Tower repository unavailable."); }
  const params=await searchParams,one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  return <TowerDirectory result={result} query={query} canCreate={canAdministrate(user)} canEdit={canAdministrate(user)} canViewDependencies={canAdministrate(user)} initialCreate={one(params.create)==="1"} initialLatitude={one(params.latitude)??""} initialLongitude={one(params.longitude)??""}/>;
}
function TowerDenied() {
  return <section aria-labelledby="tower-denied" className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 id="tower-denied" className="text-xl font-semibold text-amber-950">Permission denied</h1><p className="mt-2 text-sm text-amber-800">Your role does not have access to the Towers directory.</p></section>;
}
function TowerInvalid() {
  return <section aria-labelledby="tower-invalid" className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 id="tower-invalid" className="text-xl font-semibold text-red-950">Invalid filters</h1><p className="mt-2 text-sm text-red-800">Review the Tower URL parameters and try again.</p></section>;
}
