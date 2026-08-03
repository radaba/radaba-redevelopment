import "server-only";
import type { DataSnapshot, Database } from "firebase-admin/database";
import { firebaseAdminDatabase } from "@/lib/firebase/admin";
import {logTowerRuntime} from "@/lib/firebase/runtime-debug";
import { buildTowerWorkspace } from "@/features/tower-workspace/tower-workspace-contract";
import type { CellRecord, SourceRecord, TowerVisitRecord } from "@/features/cells-images/cells-images-types";
import type { TowerWorkspaceRepository } from "./tower-workspace-repository";
import { FirebaseAssignmentReadRepository } from "@/server/assignment/firebase-assignment-repository";
import type { AssignmentReadRepository } from "@/server/assignment/assignment-repository";

const CELL_LIMIT=100;
const entries=(snapshot:DataSnapshot)=>{const rows:{key:string;record:SourceRecord}[]=[];snapshot.forEach((child)=>{rows.push({key:child.key??"",record:child.val()??{}});});return rows;};
export class FirebaseTowerWorkspaceRepository implements TowerWorkspaceRepository {
  constructor(private readonly database:Database=firebaseAdminDatabase,private readonly assignments:AssignmentReadRepository=new FirebaseAssignmentReadRepository(database)){}
  async getTowerWorkspace(towerKey:string,context:{authorized:boolean}) {
    if(!context.authorized) return null;
    const towerSnapshot=await this.database.ref("tower").child(towerKey).once("value");
    logTowerRuntime("workspace-find",towerKey,{path:`tower/${towerKey}`,exists:towerSnapshot.exists()});
    if(!towerSnapshot.exists())return null;
    const tower={...(towerSnapshot.val()??{}),databaseKey:towerSnapshot.key??towerKey} as TowerVisitRecord;
    const towerId=String(tower.tower_id??"").trim();
    const relatedAssignments=towerId?await this.assignments.findRecentByTowerId(towerId,20):[];
    const primaryAssignmentId=String(relatedAssignments[0]?.assignment_id??"").trim();
    const queries:Promise<DataSnapshot>[]=[];
    if(towerId)queries.push(this.database.ref("cell").orderByChild("tower_id").equalTo(towerId).limitToFirst(CELL_LIMIT).once("value"));
    if(primaryAssignmentId)queries.push(this.database.ref("cell").orderByChild("assignment_id").equalTo(primaryAssignmentId).limitToFirst(CELL_LIMIT).once("value"));
    const snapshots=await Promise.all(queries);
    const unique=new Map<string,CellRecord>();
    snapshots.flatMap(entries).forEach(({key,record})=>unique.set(key,{...record,databaseKey:key}));
    return buildTowerWorkspace({tower,assignments:relatedAssignments,cells:[...unique.values()]});
  }
}
