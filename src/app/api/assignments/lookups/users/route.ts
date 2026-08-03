import { NextResponse } from "next/server";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function GET(request:Request){try{await resolveAssignmentActor();const p=new URL(request.url).searchParams,q=p.get("q")?.trim()??"",kind=p.get("kind");if(q.length<2||!["rno","rigger","coordinator"].includes(kind??""))return NextResponse.json({success:true,data:[]});const data=await new FirebaseAssignmentCommandRepository().listUsers(q,kind as "rno"|"rigger"|"coordinator",20);return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return assignmentApiError(e);}}
