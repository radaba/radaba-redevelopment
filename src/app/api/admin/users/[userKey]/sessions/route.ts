import { NextRequest, NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";
import { UserAccountLifecycleService } from "@/server/admin/user-account-lifecycle-service";
import { FirebaseAccountLifecycleAuth } from "@/server/admin/firebase-account-lifecycle-auth";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userKey: string }> },
) {
  try {
    const actor = await resolveAdministrator(),
      body = await request.json().catch(() => ({})),
      context = {
        actorUid: actor.uid,
        actorEmail: actor.email ?? "",
        ...administratorAuditRequestContext(request),
      };
    const data = await new UserAccountLifecycleService(
      new FirebaseAdminDataRepository(),
      new FirebaseAccountLifecycleAuth(),
      new FirebaseAdministratorAuditRepository(),
    ).revokeSessions(
      {
        targetUserKey: (await params).userKey,
        confirmed: body.confirmed,
        confirmSelf: body.confirmSelf,
      },
      context,
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return adminApiError(error);
  }
}
