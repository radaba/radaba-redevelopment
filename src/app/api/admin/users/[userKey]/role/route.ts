import { NextRequest, NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { AdminCommandService } from "@/server/admin/admin-command-service";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";
import { FirebaseAdministratorAuditRepository } from "@/server/admin/firebase-administrator-audit-repository";
import { administratorAuditRequestContext } from "@/server/admin/administrator-audit-request";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userKey: string }> },
) {
  try {
    const actor = await resolveAdministrator();
    const body = await request.json().catch(() => ({}));
    const result = await new AdminCommandService(
      new FirebaseAdminDataRepository(),
      new FirebaseAdministratorAuditRepository(),
    ).updateUserRole({
      actorUid: actor.uid,
      actorEmail: actor.email,
      ...administratorAuditRequestContext(request),
      targetUserKey: (await params).userKey,
      role: body.role,
      previousRole: body.previousRole,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return adminApiError(error);
  }
}
