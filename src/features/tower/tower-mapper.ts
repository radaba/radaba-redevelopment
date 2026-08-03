import type { RawTowerRecord, Tower, TowerScalar } from "./tower-types";
import {
  mapTower as runtimeMapTower,
  towerCoordinates as runtimeTowerCoordinates,
  towerDisplay as runtimeTowerDisplay,
} from "./tower-mapper.mjs";

export const mapTower = (firebaseKey: string, raw: RawTowerRecord): Tower =>
  runtimeMapTower(firebaseKey, raw) as Tower;
export const towerDisplay = (value: TowerScalar | undefined): string => runtimeTowerDisplay(value);
export const towerCoordinates = (tower: Tower): { latitude: number; longitude: number } | null =>
  runtimeTowerCoordinates(tower);

