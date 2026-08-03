import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { TOWER_TRANSFER_HEADERS, encodeCsv } from "@/features/tower/tower-transfer-contract";

export async function GET(request:Request){
  try{
    await resolveAdministrator();
    const examples=new URL(request.url).searchParams.get("examples")==="1";
    const sample=["","TWR-SAMPLE-001","Sample Site","Greenfield","Active","WEST","WEST-1","Banten","Tangerang","Cikupa","SAMPLE","Macro","10001","NE-SAMPLE","Panel","3-sector","2T2R","ROH-1","-6.2","106.8","0","2","","0","2","","2","2","2","0"];
    const rows=examples?[sample]:[];
    return new NextResponse(encodeCsv(TOWER_TRANSFER_HEADERS,rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="tower-preview-${examples?"example":"blank"}-template.csv"`,"Cache-Control":"private, no-store"}});
  }catch(error){return adminApiError(error)}
}
