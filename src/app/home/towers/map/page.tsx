import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseTowerQuery, type TowerSearchParams } from "@/features/tower/tower-query-contract";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseTowerReadRepository } from "@/server/tower/firebase-tower-repository";
import { TowerMapPage } from "@/components/tower/tower-map-page";
import {canAdministrate} from "@/features/admin/admin-authorization";
export const dynamic="force-dynamic";
export default async function TowersMapRoute({searchParams}:{searchParams:Promise<TowerSearchParams>}){
  const user=await resolveAuthenticatedUser();
  if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Permission denied</h1><p className="mt-2 text-sm">Your role does not have access to the Tower map.</p></section>;
  let query;try{query=parseTowerQuery(await searchParams)}catch{return <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-semibold">Invalid map filters</h1><p className="mt-2 text-sm">Review the Tower map URL parameters and try again.</p></section>}
  const data=await new FirebaseTowerReadRepository().map({...query,cursor:null});
  return <TowerMapPage query={query} data={data} canCreate={canAdministrate(user)}/>;
}
