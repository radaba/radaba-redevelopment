import type {RawAssignmentSnapshotEntry} from "@/features/assignment/assignment-types";
import type {TowerScalar} from "@/features/tower/tower-types";
import type {TowerAuditActor,TowerAuditRecord} from "@/features/tower/tower-audit-contract";
import type {TowerAssignmentImpact} from "@/features/tower/tower-assignment-impact-contract";
export interface TowerAssignmentImpactRead{rows:RawAssignmentSnapshotEntry[];overflow:boolean}
export interface TowerAssignmentSyncCommitInput{towerKey:string;updates:Record<string,TowerScalar>;expected:Record<string,TowerScalar>;towerAudit:TowerAuditRecord;actor:TowerAuditActor;occurredAt:string;impactToken:string;assignmentAuditIds:Record<string,string>}
export type TowerAssignmentSyncCommitResult={outcome:"updated";impact:TowerAssignmentImpact}|{outcome:"not_found"|"conflict"|"impact_conflict"|"blocked"|"overflow"};
export interface TowerAssignmentImpactRepository{readRelated(towerId:string):Promise<TowerAssignmentImpactRead>;reserveAssignmentAuditKey(assignmentKey:string):string;commitEligible(input:TowerAssignmentSyncCommitInput):Promise<TowerAssignmentSyncCommitResult>}