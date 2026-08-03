import { NextResponse } from "next/server";
import { parseRiggerQuery } from "@/features/rigger/rigger-query-contract";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { riggerApiError } from "@/server/rigger/rigger-api";
import { FirebaseRiggerReadRepository } from "@/server/rigger/firebase-rigger-repository";
import { RiggerService } from "@/server/rigger/rigger-service";
import { resolveRiggerActor } from "@/server/rigger/rigger-session";
export const dynamic="force-dynamic";
export async function GET(request:Request){try{await resolveRiggerActor();let query;try{query=parseRiggerQuery(Object.fromEntries(new URL(request.url).searchParams))}catch{return NextResponse.json({success:false,error:"Invalid Rigger query parameters."},{status:400})}const data=await new RiggerService(new FirebaseRiggerReadRepository(),new FirebaseAssignmentReadRepository()).list(query);return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){return riggerApiError(error)}}
