import type {AssignmentListItem} from "@/features/assignment/assignment-types";
import type {AorReportRecord} from "@/features/report/aor-report-types";
export interface TowerDependencyCell{key:string;rcellId:string|null;band:string|null;sector:string|null;updated:string|null}
export interface TowerDependencyData{
 tower:{key:string;id:string|null;siteId:string|null;siteName:string|null;region:string|null;subRegion:string|null;towerType:string|null;created:string|null;updated:string|null};
 assignments:{rows:AssignmentListItem[];counts:Record<string,number>;latest:string|null;oldest:string|null;bounded:boolean};
 cells:{rows:TowerDependencyCell[];bands:string[];sectors:string[];latestUpdate:string|null;bounded:boolean};
 images:{embedded:number;assignmentPhotos:number;metadataRecords:number;latestUpload:string|null;bounded:boolean};
 reports:{rows:AorReportRecord[];missing:number;latest:string|null};
 audit:{entries:number;lastModified:string|null;lastModifiedBy:string|null;bounded:boolean};
 bounds:{assignments:number;cells:number;audit:number;perAssignmentImages:number};
}