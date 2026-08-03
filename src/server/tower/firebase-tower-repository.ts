import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import { mapTower } from "@/features/tower/tower-mapper";
import { buildTowerMapData, TOWER_MAP_MAX_RECORDS, type TowerMapData } from "@/features/tower/tower-map-contract";
import { TOWER_SCAN_LIMIT, type TowerListQuery } from "@/features/tower/tower-query-contract";
import type { RawTowerRecord, Tower } from "@/features/tower/tower-types";
import { TOWER_RTDB_PATH, type TowerListResult, type TowerReadRepository } from "./tower-repository";

const text = (value: unknown) => String(value ?? "").trim().toLocaleLowerCase();
const fields = {
  region: "region", subRegion: "sub_region", province: "province", kabupaten: "kabupaten",
  cluster: "new_cluster_name", siteType: "site_type", btsType: "bts_type",
} as const;
function matches(record: RawTowerRecord, query: TowerListQuery) {
  for (const [parameter, field] of Object.entries(fields)) {
    const wanted = text(query[parameter as keyof typeof fields]);
    if (wanted && text(record[field]) !== wanted) return false;
  }
  if (!query.q) return true;
  const q = text(query.q);
  return ["tower_id", "site_id", "sitename", "new_cluster_name"].some((field) => text(record[field]).includes(q));
}
function entries(snapshot: DataSnapshot) {
  const result: { key: string; value: RawTowerRecord }[] = [];
  snapshot.forEach((child) => { result.push({ key: child.key ?? "", value: child.val() ?? {} }); });
  return result;
}
export class FirebaseTowerReadRepository implements TowerReadRepository {
  constructor(private readonly database: Database = firebaseAdminDatabase) {}
  async findByKey(key: string): Promise<Tower | null> {
    const snapshot = await this.database.ref(TOWER_RTDB_PATH).child(key).once("value");
    return snapshot.exists() ? mapTower(snapshot.key ?? key, snapshot.val() ?? {}) : null;
  }
  async map(query: TowerListQuery): Promise<TowerMapData> {
    const snapshot = await this.database
      .ref(TOWER_RTDB_PATH)
      .orderByKey()
      .limitToFirst(TOWER_MAP_MAX_RECORDS + 1)
      .once("value");
    const raw = entries(snapshot);
    const bounded = raw.slice(0, TOWER_MAP_MAX_RECORDS);
    const towers = bounded
      .filter(({ value }) => matches(value, query))
      .map(({ key, value }) => mapTower(key, value));
    return buildTowerMapData(towers, raw.length > TOWER_MAP_MAX_RECORDS);
  }
  async list(query: TowerListQuery): Promise<TowerListResult> {
    const base = this.database.ref(TOWER_RTDB_PATH);
    if (query.q && !query.cursor) {
      const exact = entries(await base.orderByChild("tower_id").equalTo(query.q.trim().toUpperCase()).limitToFirst(query.pageSize + 1).once("value"))
        .filter(({ value }) => matches(value, query));
      if (exact.length) return this.result(exact, query.pageSize, exact.length);
    }
    let databaseQuery = base.orderByKey();
    if (query.cursor) databaseQuery = databaseQuery.startAt(query.cursor);
    const raw = entries(await databaseQuery.limitToFirst(TOWER_SCAN_LIMIT + (query.cursor ? 1 : 0)).once("value"));
    const scannedRows = query.cursor && raw[0]?.key === query.cursor ? raw.slice(1) : raw;
    const matching = scannedRows.filter(({ value }) => matches(value, query));
    const selected = matching.slice(0, query.pageSize);
    const lastSelected = selected.at(-1);
    const lastSelectedIndex = lastSelected ? scannedRows.findIndex(({ key }) => key === lastSelected.key) : -1;
    const hasMore = matching.length > query.pageSize ||
      (selected.length === query.pageSize && lastSelectedIndex < scannedRows.length - 1) ||
      scannedRows.length === TOWER_SCAN_LIMIT;
    return {
      rows: selected.map(({ key, value }) => mapTower(key, value)),
      nextCursor: hasMore ? (lastSelected?.key ?? scannedRows.at(-1)?.key ?? null) : null,
      scanned: scannedRows.length,
      bounded: true,
    };
  }
  private result(rows: { key: string; value: RawTowerRecord }[], pageSize: number, scanned: number) {
    return {
      rows: rows.slice(0, pageSize).map(({ key, value }) => mapTower(key, value)),
      nextCursor: rows.length > pageSize ? rows[pageSize - 1].key : null,
      scanned,
      bounded: true as const,
    };
  }
}

