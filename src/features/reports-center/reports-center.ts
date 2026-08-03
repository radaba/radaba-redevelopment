import * as runtime from "./reports-center.mjs";
export type ReportType="assignment"|"tower"|"cell"|"rigger"|"user"|"audit"|"aor";
export interface ReportField{key:string;label:string;required:boolean;sensitive:boolean}
export interface ReportDefinition{id:ReportType;name:string;description:string;path:string;source:string;formats:readonly string[];defaults:readonly string[];filters:readonly string[];admin:boolean;bounded:true}
export const REPORT_PREVIEW_LIMIT=runtime.REPORT_PREVIEW_LIMIT as number,REPORT_EXPORT_LIMIT=runtime.REPORT_EXPORT_LIMIT as number,REPORT_CATALOG=runtime.REPORT_CATALOG as readonly ReportDefinition[];
export const reportDefinition=runtime.reportDefinition as (id:string)=>ReportDefinition|null,reportFields=runtime.reportFields as(id:string)=>readonly ReportField[];
export const validateReportRequest=runtime.validateReportRequest as unknown as(input:unknown,access?:{sensitive:boolean})=>{report:ReportDefinition;columns:string[];filters:Record<string,string>};
export const filterRows=runtime.filterRows as(rows:Record<string,unknown>[],filters:Record<string,string>)=>Record<string,unknown>[];
export const serializeReportCsv=runtime.serializeReportCsv as(rows:Record<string,unknown>[],columns:string[])=>string;
export const reportFilename=runtime.reportFilename as(type:string,date?:Date)=>string;
export class ReportContractError extends Error{code:string;constructor(code:string,message:string){super(message);this.code=code}}
