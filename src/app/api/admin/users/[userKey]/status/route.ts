import { NextRequest, NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { UserAccountLifecycleService } from "@/server/admin/user-account-lifecycle-service";
import { FirebaseAccountLifecycleAuth } from "@/server/admin/firebase-account-lifecycle-auth";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userKey: string }> },
) {
  try {
    const actor = await resolveAdministrator();
    const body = await request.json().catch(() => ({}));
    const context = {
      actorUid: actor.uid,
      actorEmail: actor.email,
      ...administratorAuditRequestContext(request),
    };
    const result = await new UserAccountLifecycleService(
      new FirebaseAdminDataRepository(),
      new FirebaseAccountLifecycleAuth(),
      new FirebaseAdministratorAuditRepository(),
    ).changeStatus(
      {
        targetUserKey: (await params).userKey,
        status: body.status,
        previousStatus: body.previousStatus,
        confirmed: body.confirmed,
      },
      context,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return adminApiError(error);
  }
}
