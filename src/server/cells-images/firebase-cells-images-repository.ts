import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import type { CellRecord, SourceRecord, TowerVisitRecord } from "@/features/cells-images/cells-images-types";
import type { CellsImagesListResult, CellsImagesReadRepository } from "./cells-images-repository";

const CELL_PATH = "cell";
const TOWER_PATH = "tower";
const MAX_PAGE = 100;
const validLimit = (limit = 25) => Math.min(Math.max(limit, 1), MAX_PAGE);
const values = (snapshot: DataSnapshot) => {
  const rows: { key: string; record: SourceRecord }[] = [];
  snapshot.forEach((child) => {
    rows.push({ key: child.key ?? "", record: child.val() ?? {} });
  });
  return rows;
};

export class FirebaseCellsImagesReadRepository implements CellsImagesReadRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}

  async listCells(cursor?: string, limit = 25): Promise<CellsImagesListResult<CellRecord>> {
    const size = validLimit(limit);
    let query = this.database.ref(CELL_PATH).orderByKey();
    if (cursor) query = query.startAt(cursor);
    let rows = values(await query.limitToFirst(size + (cursor ? 2 : 1)).once("value"));
    if (cursor && rows[0]?.key === cursor) rows = rows.slice(1);
    return {
      rows: rows.slice(0, size).map(({ key, record }) => ({ ...record, databaseKey: key })),
      nextCursor: rows.length > size ? rows[size - 1]?.key ?? null : null,
      bounded: true,
    };
  }

  async findCellByKey(key: string): Promise<CellRecord | null> {
    const snapshot = await this.database.ref(CELL_PATH).child(key).once("value");
    return snapshot.exists() ? { ...(snapshot.val() ?? {}), databaseKey: snapshot.key ?? key } : null;
  }

  async findCellsByAssignment(assignmentId: string): Promise<CellRecord[]> {
    const snapshot = await this.database.ref(CELL_PATH).orderByChild("assignment_id").equalTo(assignmentId).limitToFirst(MAX_PAGE).once("value");
    return values(snapshot).map(({ key, record }) => ({ ...record, databaseKey: key }));
  }

  async findTowerVisitByKey(key: string): Promise<TowerVisitRecord | null> {
    const snapshot = await this.database.ref(TOWER_PATH).child(key).once("value");
    return snapshot.exists() ? { ...(snapshot.val() ?? {}), databaseKey: snapshot.key ?? key } : null;
  }

  async findTowerVisitByTowerId(towerId: string): Promise<TowerVisitRecord | null> {
    const snapshot = await this.database.ref(TOWER_PATH).orderByChild("tower_id").equalTo(towerId).limitToFirst(1).once("value");
    const first = values(snapshot)[0];
    return first ? { ...first.record, databaseKey: first.key } : null;
  }

}
