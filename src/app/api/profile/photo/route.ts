import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { PROFILE_PHOTO_MAX_BYTES } from "@/features/profile/profile-photo-contract";
import { FirebaseProfileRepository } from "@/server/profile/firebase-profile-repository";
import { FirebaseProfilePhotoRepository } from "@/server/profile/firebase-profile-photo-repository";
import { ProfilePhotoService } from "@/server/profile/profile-photo-service";
import { ProfileServiceError } from "@/server/profile/profile-service";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";

const service = () =>
  new ProfilePhotoService(
    new FirebaseProfileRepository(),
    new FirebaseProfilePhotoRepository(),
    new FirebaseAdministratorAuditRepository(),
  );
const actor = async () => {
  const user = await resolveAuthenticatedUser();
  return { uid: user.uid, email: user.email };
};
const failure = (error: unknown) =>
  error instanceof ProfileServiceError
    ? NextResponse.json(
        { success: false, code: error.code, error: error.message },
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
          { success: false, error: "Unable to process profile photo." },
          { status: 500 },
        );
export async function GET() {
  try {
    const photo = await service().read(await actor());
    return new NextResponse(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    const length = Number(request.headers.get("content-length") ?? "0");
    if (length > PROFILE_PHOTO_MAX_BYTES + 1024 * 64)
      return NextResponse.json(
        {
          success: false,
          code: "photo-file-too-large",
          error: "Profile photos must be 5 MB or smaller.",
        },
        { status: 413 },
      );
    const form = await request.formData();
    const data = await service().upload(
      await actor(),
      form.get("file"),
      administratorAuditRequestContext(request),
    );
    return NextResponse.json(
      { success: true, data },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: true,
        data: await service().remove(await actor(), administratorAuditRequestContext(request)),
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
