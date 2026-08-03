import { NextResponse } from "next/server";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function GET(){try{await resolveAssignmentActor();const data=await new FirebaseAssignmentCommandRepository().listCategories();return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}});}catch(e){return assignmentApiError(e);}}
