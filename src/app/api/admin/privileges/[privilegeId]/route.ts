import { NextRequest, NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { AdminCommandService } from "@/server/admin/admin-command-service";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";
import { FirebaseNotificationProducer } from "@/server/notification/firebase-notification-producer";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ privilegeId: string }> }) {
  try {
    const actor = await resolveAdministrator();
    const body = await request.json().catch(() => ({}));
    const result = await new AdminCommandService(new FirebaseAdminDataRepository(), undefined, new FirebaseNotificationProducer()).updatePrivilegeForRole({
      actorUid: actor.uid,
      privilegeKey: (await params).privilegeId,
      role: body.role,
      enabled: body.enabled,
      previousValue: body.previousValue,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return adminApiError(error);
  }
}
