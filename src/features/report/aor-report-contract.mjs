import { createHash } from "node:crypto";
const text=(value)=>String(value??"").trim();
export function createReportId(sourceRecordKey,fieldKey="report_url"){return createHash("sha256").update(`assignment\0${sourceRecordKey}\0${fieldKey}`).digest("base64url").slice(0,32);}
export function parseReportStorageUrl(input){
  const raw=text(input);if(!raw)return {valid:false,bucket:null,objectPath:null,fileName:null,reason:"missing-url"};
  try{const url=new URL(raw);if(url.protocol!=="https:"||url.hostname!=="firebasestorage.googleapis.com")return {valid:false,bucket:null,objectPath:null,fileName:null,reason:"invalid-url"};
    const bucket=url.pathname.match(/\/b\/([^/]+)\/o\//)?.[1]??null;
    const encoded=url.pathname.split("/o/")[1];const objectPath=encoded?decodeURIComponent(encoded):null;
    const fileName=objectPath?.split("/").at(-1)??null;
    if(!bucket||!objectPath)return {valid:false,bucket,objectPath,fileName,reason:"invalid-url"};
    if(!objectPath.startsWith("report/"))return {valid:false,bucket,objectPath,fileName,reason:"unexpected-folder"};
    if(!fileName?.toLowerCase().endsWith(".pdf"))return {valid:false,bucket,objectPath,fileName,reason:"not-pdf"};
    return {valid:true,bucket,objectPath,fileName,reason:null};
  }catch{return {valid:false,bucket:null,objectPath:null,fileName:null,reason:"invalid-url"};}
}
export function classifyClosedDate(value){const raw=text(value);if(!raw)return {raw:null,display:null,sortable:null,warning:"missing-closed-date"};if(/^\d{4}-\d{2}-\d{2}$/.test(raw)){const date=new Date(`${raw}T00:00:00Z`);return Number.isNaN(date.valueOf())?{raw,display:raw,sortable:null,warning:"invalid-closed-date"}:{raw,display:raw,sortable:raw,warning:null};}if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw))return {raw,display:raw,sortable:null,warning:"ambiguous-closed-date"};return {raw,display:raw,sortable:null,warning:"invalid-closed-date"};}
export function mapAssignmentToReport(sourceRecordKey,record){
  const storedName=text(record.report_name)||null,url=text(record.report_url)||null,storage=parseReportStorageUrl(url),date=classifyClosedDate(record.closed_date);
  const warnings=[];if(!url)warnings.push("missing-url");else if(!storage.valid)warnings.push(storage.reason);
  const fileName=storedName??storage.fileName;if(!fileName)warnings.push("missing-file-name");
  if(date.warning)warnings.push(date.warning);if(!text(record.assignment_id))warnings.push("missing-assignment");
  if(!text(record.tower_id))warnings.push("missing-tower");if(!text(record.rigger_name))warnings.push("missing-rigger");
  if(!text(record.coordinator_name))warnings.push("missing-coordinator");if(!text(record.assignment_category))warnings.push("missing-category");
  const qualityStatus=!url?"missing-url":!storage.valid?"invalid-url":!fileName?"missing-file-name":"valid";
  return {reportId:createReportId(sourceRecordKey),assignmentId:text(record.assignment_id)||null,assignmentKey:sourceRecordKey,towerId:text(record.tower_id)||null,siteName:text(record.sitename)||null,closedDate:date.raw,closedDateDisplay:date.display,closedDateTime:text(record.closed_datetime)||null,riggerName:text(record.rigger_name)||null,riggerEmail:text(record.rigger_email)||null,coordinatorName:text(record.coordinator_name)||null,coordinatorEmail:text(record.coordinator_email)||null,region:text(record.region)||null,subRegion:text(record.sub_region)||null,company:text(record.company)||null,assignmentCategory:text(record.assignment_category)||null,assignmentStatus:text(record.assignment_state??record.assignment_status)||null,fileName,storageBucket:storage.bucket,storageObjectPath:storage.objectPath,downloadUrl:url,sourceRecordKey,sourceRecordType:"assignment",qualityStatus,warnings};
}
export function reportExportRows(reports){return reports.map(report=>({closed_date:report.closedDate,tower_id:report.towerId,assignment_id:report.assignmentId,rigger_name:report.riggerName,coordinator_name:report.coordinatorName,region:report.region,sub_region:report.subRegion,company:report.company,assignment_category:report.assignmentCategory,filename:report.fileName,report_status:report.qualityStatus,report_id:report.reportId}));}
