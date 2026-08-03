import { NextResponse } from "next/server";
import { AdminSessionError } from "./admin-session";
import { adminErrorStatus } from "./admin-errors";
import { IdentityRepairError } from "./user-identity-repair-service";

export function adminApiError(error: unknown) {
  if (error instanceof AdminSessionError) {
    return NextResponse.json(
      { success: false, code: "unauthorized", error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof IdentityRepairError) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: error.status },
    );
  }
  const status = adminErrorStatus(error);
  const message =
    status === 500
      ? "The administrator request could not be completed."
      : error instanceof Error
        ? error.message
        : "Invalid administrator request.";
  const fields =
    error instanceof Error && "fields" in error
      ? (error as { fields?: Record<string, string> }).fields
      : undefined;
  return NextResponse.json(
    { success: false, error: message, ...(fields ? { fields } : {}) },
    { status },
  );
}
