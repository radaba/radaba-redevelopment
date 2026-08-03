import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "../repositories/mobile-repositories.mjs";

type Row = { key: string; value: Record<string, unknown> };

function rows(snapshot: DataSnapshot): Row[] {
  const output: Row[] = [];
  snapshot.forEach((child) => {
    output.push({
      key: child.key as string,
      value: (child.val() ?? {}) as Record<string, unknown>,
    });
  });
  return output;
}

export class FirebaseMobileSecurityRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findUsersByUid(uid: string) {
    return rows(await this.database.ref(MOBILE_RTDB_PATHS.user)
      .orderByChild("uid").equalTo(uid).once("value"));
  }

  async findUsersByEmail(email: string) {
    return rows(await this.database.ref(MOBILE_RTDB_PATHS.user)
      .orderByChild("email").equalTo(email).once("value"));
  }

  async findAssignmentsById(assignmentId: string) {
    return rows(await this.database.ref(MOBILE_RTDB_PATHS.assignment)
      .orderByChild("assignment_id").equalTo(assignmentId).once("value"));
  }

  async findCellsByRcellId(rcellId: string) {
    return rows(await this.database.ref(MOBILE_RTDB_PATHS.cell)
      .orderByChild("rcell_id").equalTo(rcellId).once("value"));
  }
}
