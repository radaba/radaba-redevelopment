import type { Tower } from "@/features/tower/tower-types";
import type { TowerListQuery } from "@/features/tower/tower-query-contract";
import type { TowerMapData } from "@/features/tower/tower-map-contract";
export const TOWER_RTDB_PATH = "tower";
export interface TowerListResult {
  rows: Tower[];
  nextCursor: string | null;
  scanned: number;
  bounded: true;
}
export interface TowerReadRepository {
  list(query: TowerListQuery): Promise<TowerListResult>;
  map(query: TowerListQuery): Promise<TowerMapData>;
  findByKey(key: string): Promise<Tower | null>;
}

