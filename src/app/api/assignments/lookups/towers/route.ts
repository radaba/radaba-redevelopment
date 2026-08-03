import { NextResponse } from "next/server";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function GET(request:Request){try{await resolveAssignmentActor();const q=new URL(request.url).searchParams.get("q")?.trim()??"";if(q.length<2)return NextResponse.json({success:true,data:[]});const data=await new FirebaseAssignmentCommandRepository().listTowers(q,20);return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return assignmentApiError(e);}}
