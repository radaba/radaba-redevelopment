import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await resolveAdministrator();
    const roles = await new FirebaseAdminDataRepository().listRoles();
    return NextResponse.json({ success: true, data: roles }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return adminApiError(error);
  }
}
