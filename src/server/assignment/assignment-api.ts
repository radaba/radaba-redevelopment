import { NextResponse } from "next/server";
import { AssignmentCommandError } from "./assignment-command-errors";
import { AssignmentSessionError } from "./assignment-session";
export function assignmentApiError(error: unknown) {
  if (error instanceof AssignmentSessionError)
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  if (error instanceof AssignmentCommandError) {
    if (error.code === "ASSIGNMENT_COMPLETED")
      return NextResponse.json(
        { success: false, code: error.code, message: error.message },
        { status: error.status },
      );
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: error.status },
    );
  }
  console.error("Assignment command failed", error instanceof Error ? error.message : "unknown");
  return NextResponse.json(
    { success: false, error: "The Assignment request could not be completed." },
    { status: 500 },
  );
}
