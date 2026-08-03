import { parseTowerQuery as runtimeParseTowerQuery, TOWER_PAGE_SIZES, TOWER_SCAN_LIMIT } from "./tower-query-contract.mjs";
export { TOWER_PAGE_SIZES, TOWER_SCAN_LIMIT };
export interface TowerListQuery {
  q: string; region: string; subRegion: string; province: string; kabupaten: string;
  cluster: string; siteType: string; btsType: string; pageSize: number; cursor: string | null;
}
export type TowerSearchParams = Record<string, string | string[] | undefined>;
export const parseTowerQuery = (input: TowerSearchParams): TowerListQuery =>
  runtimeParseTowerQuery(input) as TowerListQuery;

