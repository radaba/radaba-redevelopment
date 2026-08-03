import type { AorReportRecord, ReportFilters, ReportsPage } from "@/features/report/aor-report-types";
export interface ReportAuthorization {authorized:boolean}
export interface AorReportRepository {getReportsList(filters:ReportFilters,context:ReportAuthorization):Promise<ReportsPage>;getReportById(id:string,context:ReportAuthorization):Promise<AorReportRecord|null>;getReportsForAssignment(id:string,context:ReportAuthorization):Promise<AorReportRecord[]>;getReportsForTower(id:string,context:ReportAuthorization):Promise<AorReportRecord[]>}
