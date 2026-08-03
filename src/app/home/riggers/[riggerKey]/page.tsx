import { notFound } from "next/navigation";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseRiggerReadRepository } from "@/server/rigger/firebase-rigger-repository";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { RiggerService } from "@/server/rigger/rigger-service";
import { RiggerDetail } from "@/components/rigger/rigger-detail";
export const dynamic="force-dynamic";
export default async function RiggerDetailPage({params}:{params:Promise<{riggerKey:string}>}){
 const user=await resolveAuthenticatedUser();if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Permission denied</h1><p className="mt-2 text-sm">Your role does not have access to Rigger details.</p></section>;
 const {riggerKey}=await params;if(!/^[A-Za-z0-9_-]{1,160}$/.test(riggerKey))notFound();
 const data=await new RiggerService(new FirebaseRiggerReadRepository(),new FirebaseAssignmentReadRepository()).detail(riggerKey);if(!data)notFound();
 return <RiggerDetail data={data}/>;
}

