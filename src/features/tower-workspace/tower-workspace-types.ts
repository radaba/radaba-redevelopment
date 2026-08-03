import type { AssignmentListItem } from "@/features/assignment/assignment-types";
import type { CellRecord, NormalizedImageReference, TowerVisitRecord } from "@/features/cells-images/cells-images-types";
export interface TowerSectorGroup { sector:string; cells:CellRecord[] }
export interface TowerPersonSummary { role:string; name:string; email:string; sources:string[] }
export interface TowerTimelineEvent { timestamp:string; label:string; source:string; actor:string|null; relatedKey:string|null }
export interface DataQualityWarning { severity:"info"|"warning"|"error"; code:string; message:string; recordType:string; recordKey:string|null }
export interface TowerWorkspaceRecord {
  tower:TowerVisitRecord; assignment:AssignmentListItem|null; assignments:AssignmentListItem[]; cells:CellRecord[];
  groupedSectors:TowerSectorGroup[]; towerImages:NormalizedImageReference[]; cellImages:NormalizedImageReference[];
  people:TowerPersonSummary[]; timeline:TowerTimelineEvent[]; warnings:DataQualityWarning[];
}
