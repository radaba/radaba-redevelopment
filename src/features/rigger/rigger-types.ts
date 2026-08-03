import type { AssignmentListItem } from "@/features/assignment/assignment-types";
export interface RawRiggerRecord { [field:string]:unknown }
export interface Rigger {
  firebaseKey:string; uid:string|null; name:string|null; email:string|null; phone:string|null;
  role:string|null; position:string|null; status:string|null; company:string|null;
  department:string|null; region:string|null; subRegion:string|null; officeLocation:string|null;
  type:string|null; joinDate:string|null; createDate:string|null; createDateTime:string|null;
}
export interface RiggerWorkload {
  activeAssignments:number; latestAssignment:AssignmentListItem|null;
}
export interface RiggerListItem extends Rigger { workload:RiggerWorkload }
export interface RiggerListResult {
  rows:RiggerListItem[]; nextCursor:string|null; scanned:number; bounded:true;
  workloadWindowBounded:boolean;
}
export interface RiggerDetailData {
  rigger:Rigger; assignments:AssignmentListItem[]; assignmentsFailed:boolean; assignmentWindowBounded:boolean;
}

