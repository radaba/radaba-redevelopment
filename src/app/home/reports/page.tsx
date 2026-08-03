import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseReportFilters,type ReportSearchParams } from "@/features/report/report-query";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseAorReportRepository } from "@/server/report/firebase-report-repository";
import { ReportsCenter } from "@/components/report/reports-center";
export const dynamic="force-dynamic";
export default async function ReportsPage({searchParams}:{searchParams:Promise<ReportSearchParams>}){const user=await resolveAuthenticatedUser();if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Unauthorized</h1><p className="mt-2 text-sm">Active Assignment access is required to review AOR reports.</p></section>;const filters=parseReportFilters(await searchParams);let result;try{result=await new FirebaseAorReportRepository().getReportsList(filters,{authorized:true});}catch{throw new Error("Report repository unavailable.");}return <ReportsCenter result={result} filters={filters}/>;}
