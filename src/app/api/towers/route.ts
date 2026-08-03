import { NextResponse } from "next/server";
import { parseTowerQuery } from "@/features/tower/tower-query-contract";
import { FirebaseTowerReadRepository } from "@/server/tower/firebase-tower-repository";
import { resolveTowerActor } from "@/server/tower/tower-session";
import { towerApiError } from "@/server/tower/tower-api";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { FirebaseTowerCommandRepository } from "@/server/tower/firebase-tower-command-repository";
import { TowerCommandService, TowerCreateError } from "@/server/tower/tower-command-service";
import { towerAuditActor } from "@/server/tower/tower-audit-session";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await resolveTowerActor();
    const params = Object.fromEntries(new URL(request.url).searchParams);
    let query;
    try { query = parseTowerQuery(params); }
    catch { return NextResponse.json({ success: false, error: "Invalid Tower query parameters." }, { status: 400 }); }
    const data = await new FirebaseTowerReadRepository().list(query);
    return NextResponse.json({ success: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return towerApiError(error); }
}
export async function POST(request:Request){try{const user=await resolveAdministrator();const body=await request.json().catch(()=>null);const data=await new TowerCommandService(new FirebaseTowerCommandRepository()).create(body,towerAuditActor(user));return NextResponse.json({success:true,data},{status:201})}catch(error){if(error instanceof TowerCreateError)return NextResponse.json({success:false,error:error.message,code:error.code,existingKey:error.existingKey},{status:error.code==="DUPLICATE"?409:400});return adminApiError(error)}}
