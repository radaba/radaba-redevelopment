import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseAssignmentListParams, type AssignmentSearchParams } from "@/features/assignment/assignment-list-params";
import {
  ASSIGNMENT_EXPORT_MAX_ROWS,
  assignmentCsvFilename,
  serializeAssignmentCsv,
} from "@/features/assignment/assignment-csv-contract";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";

export const dynamic = "force-dynamic";

function searchParamsObject(params: URLSearchParams): AssignmentSearchParams {
  const result: AssignmentSearchParams = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    result[key] = values.length > 1 ? values : values[0];
  }
  return result;
}

function jakartaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET(request: NextRequest) {
  let user;
  try {
    user = await resolveAuthenticatedUser();
  } catch {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  if (!canAccessAssignment(user.privilege, user.role)) {
    return NextResponse.json({ success: false, error: "Assignment access is required." }, { status: 403 });
  }

  const query = parseAssignmentListParams(searchParamsObject(request.nextUrl.searchParams));

  try {
    const result = await new FirebaseAssignmentReadRepository().readForExport(query, ASSIGNMENT_EXPORT_MAX_ROWS);
    if (result.exceededLimit) {
      return NextResponse.json({
        success: false,
        error: `Export exceeds ${ASSIGNMENT_EXPORT_MAX_ROWS} rows. Narrow the date range or filters.`,
      }, { status: 413 });
    }

    const filename = assignmentCsvFilename(jakartaToday());
    return new NextResponse(serializeAssignmentCsv(result.rows), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({
      success: false,
      error: "The Assignment export could not be generated.",
    }, { status: 503 });
  }
}
