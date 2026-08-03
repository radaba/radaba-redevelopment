import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

type MobileRow = { key: string; value: Record<string, unknown> };

function children(snapshot: DataSnapshot): MobileRow[] {
  const rows: MobileRow[] = [];
  snapshot.forEach((child) => {
    rows.push({
      key: child.key as string,
      value: (child.val() ?? {}) as Record<string, unknown>,
    });
  });
  return rows;
}

export class FirebaseMobileAssignmentCommandRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findAssignments(assignmentId: unknown) {
    return children(
      await this.database.ref(MOBILE_RTDB_PATHS.assignment)
        .orderByChild("assignment_id").equalTo(assignmentId as string).once("value"),
    );
  }

  async findUsersByEmail(email: unknown) {
    return children(
      await this.database.ref(MOBILE_RTDB_PATHS.user)
        .orderByChild("email").equalTo(email as string).once("value"),
    );
  }

  async updateAssignment(key: string, update: Record<string, unknown>) {
    await this.database.ref(`${MOBILE_RTDB_PATHS.assignment}/${key}`).update(update);
  }
}

