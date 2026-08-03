import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { createLegacyJakartaClock } from "../compatibility/timestamps.mjs";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

type Row = { key: string; value: Record<string, unknown> };
const rows = (snapshot: DataSnapshot) => {
  const result: Row[] = [];
  snapshot.forEach((child) => {
    result.push({
      key: child.key as string,
      value: (child.val() ?? {}) as Record<string, unknown>,
    });
  });
  return result;
};

export class FirebaseMobileAssignmentFinishRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  private async query(path: string, child: string, value: unknown, first = false) {
    let query = this.database.ref(path).orderByChild(child).equalTo(value as string);
    if (first) query = query.limitToFirst(1);
    return rows(await query.once("value"));
  }

  findAssignments(id: unknown) {
    return this.query(MOBILE_RTDB_PATHS.assignment, "assignment_id", id);
  }
  findUsersByEmail(email: unknown) {
    return this.query(MOBILE_RTDB_PATHS.user, "email", email);
  }
  async upsertCell(rcellId: string, value: Record<string, unknown>) {
    const matches = await this.query(MOBILE_RTDB_PATHS.cell, "rcell_id", rcellId);
    if (matches.length) {
      for (const row of matches) {
        await this.database.ref(`${MOBILE_RTDB_PATHS.cell}/${row.key}`).update(value);
      }
    } else {
      await this.database.ref(MOBILE_RTDB_PATHS.cell).push(value);
    }
  }
  async updateImages(id: unknown, value: Record<string, unknown>) {
    for (const row of await this.query(MOBILE_RTDB_PATHS.image, "assignment_id", id)) {
      await this.database.ref(`${MOBILE_RTDB_PATHS.image}/${row.key}`).update(value);
    }
  }
  async updateTower(id: unknown, value: Record<string, unknown>) {
    for (const row of await this.query(MOBILE_RTDB_PATHS.tower, "tower_id", id)) {
      await this.database.ref(`${MOBILE_RTDB_PATHS.tower}/${row.key}`).update(value);
    }
  }
  async updateUsersByEmail(email: unknown, value: Record<string, unknown>) {
    for (const row of await this.query(MOBILE_RTDB_PATHS.user, "email", email)) {
      await this.database.ref(`${MOBILE_RTDB_PATHS.user}/${row.key}`).update(value);
    }
  }
  async updateAssignment(key: string, value: Record<string, unknown>) {
    await this.database.ref(`${MOBILE_RTDB_PATHS.assignment}/${key}`).update(value);
  }
  async findProductivityRow(path: string, index: string) {
    return (await this.query(path, "index_closed_date_stakeholder", index, true))[0];
  }
  async findRiggerAchievement(path: string, index: string) {
    return (await this.query(path, "index", index, true))[0];
  }
  createPushKey(path: string) {
    return this.database.ref(path).push().key as string;
  }
  async transactionProductivity(
    path: string,
    mapper: (value: Record<string, unknown> | null) => Record<string, unknown>,
  ) {
    await this.database.ref(path).transaction(mapper);
  }
  async transactionRiggerAchievement(
    path: string,
    mapper: (value: Record<string, unknown> | null) => Record<string, unknown>,
  ) {
    await this.database.ref(path).transaction(mapper);
  }
  timestamp() {
    return createLegacyJakartaClock().current().currDatetime;
  }
}

