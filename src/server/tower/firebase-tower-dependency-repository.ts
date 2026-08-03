import "server-only";
import type {DataSnapshot,Database} from "firebase-admin/database";
import {firebaseAdminDatabase} from "@/lib/firebase/admin";
import {mapRawAssignmentToListItem} from "@/features/assignment/assignment-mapper";
import {extractEmbeddedImages} from "@/features/cells-images/embedded-image-contract";
import {mapAssignmentToReport} from "@/features/report/aor-report-contract";
import {mapTowerAuditEvent} from "@/features/tower/tower-audit-contract";
import type {RawAssignmentRecord} from "@/features/assignment/assignment-types";
import type {SourceRecord} from "@/features/cells-images/cells-images-types";
import type {TowerDependencyData,TowerDependencyCell} from "@/features/tower/tower-dependency-types";
const ASSIGNMENT_LIMIT=50,CELL_LIMIT=100,AUDIT_LIMIT=50,IMAGE_LIMIT=100;
const text=(value:unknown)=>String(value??"").trim()||null;
const children=(snapshot:DataSnapshot)=>{const rows:{key:string;value:SourceRecord}[]=[];snapshot.forEach(child=>{rows.push({key:child.key??"",value:child.val()??{}})});return rows};
const latest=(values:(string|null)[])=>values.filter((value):value is string=>Boolean(value)).sort().at(-1)??null;
export class FirebaseTowerDependencyRepository{
 constructor(private readonly database:Database=firebaseAdminDatabase){}
 async get(towerKey:string):Promise<TowerDependencyData|null>{
  const towerSnapshot=await this.database.ref("tower").child(towerKey).once("value");if(!towerSnapshot.exists())return null;
  const raw=towerSnapshot.val() as SourceRecord,towerId=text(raw.tower_id);
  const assignmentSnapshot=towerId?await this.database.ref("assignment").orderByChild("tower_id").equalTo(towerId).limitToLast(ASSIGNMENT_LIMIT+1).once("value"):null;
  const assignmentEntries=assignmentSnapshot?children(assignmentSnapshot):[],assignmentsBounded=assignmentEntries.length>ASSIGNMENT_LIMIT,selectedAssignments=assignmentEntries.slice(-ASSIGNMENT_LIMIT);
  const assignmentIds=selectedAssignments.map(row=>text(row.value.assignment_id)).filter((value):value is string=>Boolean(value));
  const [towerCells,auditSnapshot,...dependentSnapshots]=await Promise.all([
   towerId?this.database.ref("cell").orderByChild("tower_id").equalTo(towerId).limitToFirst(CELL_LIMIT+1).once("value"):Promise.resolve(null),
   this.database.ref(`tower_audit/${towerKey}`).orderByKey().limitToLast(AUDIT_LIMIT+1).once("value"),
   ...assignmentIds.flatMap(id=>[
    this.database.ref("cell").orderByChild("assignment_id").equalTo(id).limitToFirst(CELL_LIMIT+1).once("value"),
    this.database.ref("image").orderByChild("assignment_id").equalTo(id).limitToFirst(IMAGE_LIMIT+1).once("value")
   ]),
   ...selectedAssignments.map(row=>this.database.ref("assignment_photo").child(row.key).orderByKey().limitToFirst(IMAGE_LIMIT+1).once("value"))
  ]);
  const assignmentCellSnapshots=dependentSnapshots.slice(0,assignmentIds.length*2).filter((_,index)=>index%2===0),imageSnapshots=dependentSnapshots.slice(0,assignmentIds.length*2).filter((_,index)=>index%2===1),photoSnapshots=dependentSnapshots.slice(assignmentIds.length*2);
  const cellMap=new Map<string,{key:string;value:SourceRecord}>();for(const row of [...(towerCells?children(towerCells):[]),...assignmentCellSnapshots.flatMap(children)])cellMap.set(row.key,row);
  const cellRows=[...cellMap.values()].slice(0,CELL_LIMIT),cellsBounded=cellMap.size>CELL_LIMIT||(towerCells?children(towerCells).length>CELL_LIMIT:false)||assignmentCellSnapshots.some(snapshot=>children(snapshot).length>CELL_LIMIT);
  const embedded=[...extractEmbeddedImages({sourceRecordType:"tower",sourceRecordKey:towerKey,record:raw}),...cellRows.flatMap(row=>extractEmbeddedImages({sourceRecordType:"cell",sourceRecordKey:row.key,record:row.value}))];
  const photos=photoSnapshots.flatMap(children),metadata=imageSnapshots.flatMap(children),imageBounded=photoSnapshots.some(x=>children(x).length>IMAGE_LIMIT)||imageSnapshots.some(x=>children(x).length>IMAGE_LIMIT);
  const assignmentRows=selectedAssignments.map(({key,value})=>mapRawAssignmentToListItem(key,value as RawAssignmentRecord)).sort((a,b)=>String(b.created_datetime??b.created_date??"").localeCompare(String(a.created_datetime??a.created_date??"")));
  const reports=selectedAssignments.map(({key,value})=>({key,value:value as RawAssignmentRecord})).filter(({value})=>Boolean(text(value.report_name)||text(value.report_url)||text(value.closed_date)||text(value.closed_datetime))).map(({key,value})=>mapAssignmentToReport(key,value));
  const audits=children(auditSnapshot).map(row=>mapTowerAuditEvent(row.key,row.value)).filter((row):row is NonNullable<typeof row>=>Boolean(row)).sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt));
  const dates=assignmentRows.map(row=>row.created_datetime??row.created_date).filter((value):value is string=>Boolean(value)).sort();
  const counts=Object.fromEntries(["Open","Accepted","On Progress","Paused","Finished","Rejected","Dropped"].map(status=>[status,assignmentRows.filter(row=>(row.assignment_state??row.assignment_status)===status).length]));
  const cells:TowerDependencyCell[]=cellRows.map(({key,value})=>({key,rcellId:text(value.rcell_id),band:text(value.band),sector:text(value.sector),updated:text(value.updated_datetime??value.updated_at??value.closed_datetime??value.closed_date)}));
  return{tower:{key:towerKey,id:towerId,siteId:text(raw.site_id),siteName:text(raw.sitename),region:text(raw.region),subRegion:text(raw.sub_region),towerType:text(raw.tower_type??raw.site_type),created:text(raw.created_datetime??raw.created_at??raw.created_date),updated:text(raw.updated_datetime??raw.updated_at??raw.updated_date)},assignments:{rows:assignmentRows,counts,latest:dates.at(-1)??null,oldest:dates[0]??null,bounded:assignmentsBounded},cells:{rows:cells,bands:[...new Set(cells.map(row=>row.band).filter((x):x is string=>Boolean(x)))].sort(),sectors:[...new Set(cells.map(row=>row.sector).filter((x):x is string=>Boolean(x)))].sort(),latestUpdate:latest(cells.map(row=>row.updated)),bounded:cellsBounded},images:{embedded:embedded.length,assignmentPhotos:photos.length,metadataRecords:metadata.length,latestUpload:latest([...embedded.map(row=>row.submittedAt),...photos.map(row=>text(row.value.uploaded_at)),...metadata.map(row=>text(row.value.updated_datetime??row.value.closed_datetime??row.value.timestamp))]),bounded:imageBounded},reports:{rows:reports,missing:assignmentRows.length-reports.length,latest:latest(reports.map(row=>row.closedDateTime??row.closedDate))},audit:{entries:audits.slice(0,AUDIT_LIMIT).length,lastModified:audits[0]?.occurredAt??null,lastModifiedBy:audits[0]?.actorName??audits[0]?.actorEmail??null,bounded:children(auditSnapshot).length>AUDIT_LIMIT},bounds:{assignments:ASSIGNMENT_LIMIT,cells:CELL_LIMIT,audit:AUDIT_LIMIT,perAssignmentImages:IMAGE_LIMIT}};
 }
}