import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseRiggerQuery,type RiggerSearchParams } from "@/features/rigger/rigger-query-contract";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseRiggerReadRepository } from "@/server/rigger/firebase-rigger-repository";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { RiggerService } from "@/server/rigger/rigger-service";
import { RiggerDirectory } from "@/components/rigger/rigger-directory";
export const dynamic="force-dynamic";
export default async function RiggersPage({searchParams}:{searchParams:Promise<RiggerSearchParams>}){
 const user=await resolveAuthenticatedUser();if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))return <Denied/>;
 let query;try{query=parseRiggerQuery(await searchParams)}catch{return <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-semibold">Invalid Rigger filters</h1><p className="mt-2 text-sm">Review the URL parameters and try again.</p></section>}
 const result=await new RiggerService(new FirebaseRiggerReadRepository(),new FirebaseAssignmentReadRepository()).list(query);
 return <RiggerDirectory result={result} query={query}/>;
}
function Denied(){return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Permission denied</h1><p className="mt-2 text-sm">Your role does not have access to the Rigger directory.</p></section>}

