import type { RawAssignmentRecord } from "@/features/assignment/assignment-types";
import type { AorReportRecord } from "./aor-report-types";
import * as implementation from "./aor-report-contract.mjs";
export const createReportId=implementation.createReportId as (key:string,fieldKey?:string)=>string;
export const parseReportStorageUrl=implementation.parseReportStorageUrl as (url:unknown)=>{valid:boolean;bucket:string|null;objectPath:string|null;fileName:string|null;reason:string|null};
export const classifyClosedDate=implementation.classifyClosedDate as (value:unknown)=>{raw:string|null;display:string|null;sortable:string|null;warning:string|null};
export const mapAssignmentToReport=implementation.mapAssignmentToReport as (key:string,record:RawAssignmentRecord)=>AorReportRecord;
export const reportExportRows=implementation.reportExportRows as (reports:AorReportRecord[])=>Record<string,string|null>[];
