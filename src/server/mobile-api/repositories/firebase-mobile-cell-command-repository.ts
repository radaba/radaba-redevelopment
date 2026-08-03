import "server-only";

import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { MOBILE_RTDB_PATHS } from "./mobile-repositories.mjs";

type CellMatch = { key: string; value: Record<string, unknown> };

function children(snapshot: DataSnapshot): CellMatch[] {
  const records: CellMatch[] = [];
  snapshot.forEach((child) => {
    records.push({
      key: child.key as string,
      value: (child.val() ?? {}) as Record<string, unknown>,
    });
  });
  return records;
}

export class FirebaseMobileCellCommandRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async findCellsByRcellId(rcellId: unknown): Promise<CellMatch[]> {
    const snapshot = await this.database
      .ref(MOBILE_RTDB_PATHS.cell)
      .orderByChild("rcell_id")
      .equalTo(rcellId as string | number | boolean | null)
      .once("value");
    return children(snapshot);
  }

  async updateCell(key: string, value: Record<string, unknown>): Promise<void> {
    await this.database.ref(`${MOBILE_RTDB_PATHS.cell}/${key}`).update(value);
  }

  async createCell(value: Record<string, unknown>): Promise<void> {
    await this.database.ref(MOBILE_RTDB_PATHS.cell).push(value);
  }
}
