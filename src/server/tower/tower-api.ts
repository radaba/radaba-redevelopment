import { NextResponse } from "next/server";
import { AssignmentSessionError } from "@/server/assignment/assignment-session";
export function towerApiError(error: unknown) {
  if (error instanceof AssignmentSessionError)
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  console.error("Tower read failed", error instanceof Error ? error.message : "unknown");
  return NextResponse.json({ success: false, error: "The Tower request could not be completed." }, { status: 500 });
}

