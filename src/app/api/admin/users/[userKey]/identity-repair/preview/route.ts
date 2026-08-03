import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { validAdminUserKey } from "@/features/admin/admin-user-detail";
import {
  FirebaseIdentityRepairAuth,
  FirebaseIdentityRepairRepository,
} from "@/server/admin/firebase-user-identity-repair";
import { UserIdentityRepairService } from "@/server/admin/user-identity-repair-service";

export async function POST(_: Request, { params }: { params: Promise<{ userKey: string }> }) {
  try {
    await resolveAdministrator();
    const { userKey } = await params;
    if (!validAdminUserKey(userKey))
      return NextResponse.json(
        { success: false, code: "user_not_found", error: "User was not found." },
        { status: 404 },
      );
    const data = await new UserIdentityRepairService(
      new FirebaseIdentityRepairRepository(),
      new FirebaseIdentityRepairAuth(),
    ).preview(userKey);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return adminApiError(error);
  }
}
