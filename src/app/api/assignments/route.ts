import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
import { FirebaseAssignmentCommandRepository } from "@/server/assignment/firebase-assignment-command-repository";
import { AssignmentCommandService } from "@/server/assignment/assignment-command-service";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";
const schema=z.object({towerKey:z.string().min(1).max(200),rnoKey:z.string().min(1).max(200),riggerKey:z.string().min(1).max(200),coordinatorKey:z.string().min(1).max(200),category:z.string().min(1).max(200),planDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),description:z.string().max(2000).optional()}).strict();
export async function POST(request:Request){try{await resolveAssignmentActor();const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({success:false,code:"invalid-input",error:"Invalid Assignment input."},{status:400});const data=await new AssignmentCommandService(new FirebaseAssignmentCommandRepository(), undefined, new FirebaseNotificationProducer()).createAssignment(parsed.data);return NextResponse.json({success:true,data},{status:201,headers:{"Cache-Control":"private, no-store"}});}catch(e){return assignmentApiError(e);}}
