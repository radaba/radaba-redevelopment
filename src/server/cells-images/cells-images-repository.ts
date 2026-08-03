import type { CellRecord, TowerVisitRecord } from "@/features/cells-images/cells-images-types";

export interface CellsImagesListResult<T> {
  rows: T[];
  nextCursor: string | null;
  bounded: true;
}
export interface CellsImagesReadRepository {
  listCells(cursor?: string, limit?: number): Promise<CellsImagesListResult<CellRecord>>;
  findCellByKey(key: string): Promise<CellRecord | null>;
  findCellsByAssignment(assignmentId: string): Promise<CellRecord[]>;
  findTowerVisitByKey(key: string): Promise<TowerVisitRecord | null>;
  findTowerVisitByTowerId(towerId: string): Promise<TowerVisitRecord | null>;
}
