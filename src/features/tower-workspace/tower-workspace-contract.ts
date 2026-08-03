import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type { CellRecord, TowerVisitRecord } from "@/features/cells-images/cells-images-types";
import type { TowerWorkspaceRecord } from "./tower-workspace-types";
import * as implementation from "./tower-workspace-contract.mjs";
export const groupTowerCells=implementation.groupTowerCells as (cells:CellRecord[])=>TowerWorkspaceRecord["groupedSectors"];
export const towerCoordinates=implementation.towerCoordinates as (record:TowerVisitRecord)=>{latitude:number;longitude:number}|null;
export const buildTowerWorkspace=implementation.buildTowerWorkspace as (input:{tower:TowerVisitRecord;assignments?:AssignmentListItem[];cells?:CellRecord[]})=>TowerWorkspaceRecord;
