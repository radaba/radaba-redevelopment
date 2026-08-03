import { NextResponse } from "next/server";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { readAssignmentImport } from "@/server/assignment/assignment-import-file";
import { AssignmentImportService } from "@/server/assignment/assignment-import-service";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
export async function POST(request:Request){try{await resolveAssignmentActor();const {filename,rows}=await readAssignmentImport(request);const data=await new AssignmentImportService(new FirebaseAssignmentCommandRepository()).validate(rows);return NextResponse.json({success:true,data:{filename,...data}},{headers:{"Cache-Control":"private, no-store"}});}catch(error){return assignmentApiError(error);}}
