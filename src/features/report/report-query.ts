import type { ReportFilters } from "./aor-report-types";
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
const clean=(value:string|string[]|undefined,max=160)=>String(one(value)??"").trim().slice(0,max);
export type ReportSearchParams=Record<string,string|string[]|undefined>;
export function parseReportFilters(params:ReportSearchParams):ReportFilters{const page=Number(clean(params.page)),pageSize=Number(clean(params.pageSize));return {q:clean(params.q,200),tower:clean(params.tower),assignment:clean(params.assignment),region:clean(params.region),subRegion:clean(params.subRegion),company:clean(params.company),category:clean(params.category),coordinator:clean(params.coordinator),rigger:clean(params.rigger),quality:clean(params.quality),hasReport:clean(params.hasReport),from:clean(params.from,10),to:clean(params.to,10),page:Number.isInteger(page)&&page>0?page:1,pageSize:[25,50,100].includes(pageSize)?pageSize:50};}
