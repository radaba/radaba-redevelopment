import { NextResponse } from "next/server";
import { ASSIGNMENT_IMPORT_FILENAME, assignmentImportTemplate } from "@/features/assignment/assignment-import-contract";
import { resolveAssignmentActor } from "@/server/assignment/assignment-session";
import { assignmentApiError } from "@/server/assignment/assignment-api";
export async function GET(){try{await resolveAssignmentActor();return new NextResponse(assignmentImportTemplate(),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="${ASSIGNMENT_IMPORT_FILENAME}"`,"Cache-Control":"private, no-store"}});}catch(error){return assignmentApiError(error);}}
