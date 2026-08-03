import { NextResponse } from "next/server";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { parseTowerQuery } from "@/features/tower/tower-query-contract";
import { TOWER_EXPORT_MAX_ROWS, towerExportCsv } from "@/features/tower/tower-transfer-contract";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseTowerReadRepository } from "@/server/tower/firebase-tower-repository";
import { towerApiError } from "@/server/tower/tower-api";

export async function GET(request:Request){
  try{
    const user=await resolveAuthenticatedUser();
    if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role))
      return NextResponse.json({success:false,error:"Tower read permission required."},{status:403});
    const params=new URL(request.url).searchParams,scope=params.get("scope")??"page";
    if(!["page","selected"].includes(scope))return NextResponse.json({success:false,error:"Only current-page and selected-Tower export are supported."},{status:400});
    const query=parseTowerQuery({...Object.fromEntries(params),pageSize:String(TOWER_EXPORT_MAX_ROWS)});
    const result=await new FirebaseTowerReadRepository().list(query);
    const selected=new Set((params.get("keys")??"").split(",").filter(Boolean));
    const rows=scope==="selected"?result.rows.filter(row=>selected.has(row.firebaseKey)):result.rows;
    if(scope==="selected"&&!selected.size)return NextResponse.json({success:false,error:"Select at least one Tower."},{status:400});
    const date=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Jakarta",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    return new NextResponse(towerExportCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="radaba-towers-${date}.csv"`,"Cache-Control":"private, no-store","X-Export-Scope":scope,"X-Export-Row-Count":String(rows.length)}});
  }catch(error){return towerApiError(error)}
}
