import { NextResponse } from "next/server";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import { riggerApiError } from "@/server/rigger/rigger-api";
import { FirebaseRiggerReadRepository } from "@/server/rigger/firebase-rigger-repository";
import { RiggerService } from "@/server/rigger/rigger-service";
import { resolveRiggerActor } from "@/server/rigger/rigger-session";
const validKey=(key:string)=>/^[A-Za-z0-9_-]{1,160}$/.test(key);
export async function GET(_request:Request,context:{params:Promise<{riggerKey:string}>}){try{await resolveRiggerActor();const{riggerKey}=await context.params;if(!validKey(riggerKey))return NextResponse.json({success:false,error:"Invalid Rigger key."},{status:400});const data=await new RiggerService(new FirebaseRiggerReadRepository(),new FirebaseAssignmentReadRepository()).detail(riggerKey);if(!data)return NextResponse.json({success:false,error:"Rigger not found."},{status:404});return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){return riggerApiError(error)}}
