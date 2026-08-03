import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
import { FirebaseProfileRepository } from "@/server/profile/firebase-profile-repository";
import { ProfileService, ProfileServiceError } from "@/server/profile/profile-service";

const service = () =>
  new ProfileService(new FirebaseProfileRepository(), new FirebaseAdministratorAuditRepository());
const actor = async () => {
  const user = await resolveAuthenticatedUser();
  return { uid: user.uid, email: user.email };
};
const errorResponse = (error: unknown) =>
  error instanceof ProfileServiceError
    ? NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.status },
      )
    : error instanceof Error && error.message === "Unauthorized"
      ? NextResponse.json(
          {
            success: false,
            code: "unauthenticated",
            error: "Your session has expired. Please sign in again.",
          },
          { status: 401 },
        )
      : NextResponse.json(
          { success: false, code: "profile_update_failed", error: "Unable to update profile." },
          { status: 500 },
        );

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: { profile: await service().read(await actor()) },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      data: await service().update(await actor(), body, administratorAuditRequestContext(request)),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
