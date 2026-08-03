import { NextResponse } from "next/server";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { adminApiError } from "@/server/admin/admin-api";
import { readTowerPreviewFile } from "@/server/tower/tower-transfer-file";
import { TowerTransferRepository } from "@/server/tower/tower-transfer-repository";
import { TOWER_MATCH_SCAN_LIMIT, TowerTransferError, previewTowerRows } from "@/features/tower/tower-transfer-contract";

export async function POST(request:Request){
  try{
    await resolveAdministrator();
    const {filename,parsed}=await readTowerPreviewFile(request);
    const existing=await new TowerTransferRepository().boundedEntries(TOWER_MATCH_SCAN_LIMIT);
    if(existing.overflow)return NextResponse.json({success:false,code:"MATCH_CAPACITY",error:`Tower matching exceeds the safe ${TOWER_MATCH_SCAN_LIMIT}-record bound. Preview was stopped.`},{status:409});
    const data=previewTowerRows(parsed,existing.entries);
    return NextResponse.json({success:true,data:{filename,previewedAt:new Date().toISOString(),...data,commitAvailable:true}},{headers:{"Cache-Control":"private, no-store"}});
  }catch(error){
    if(error instanceof TowerTransferError)return NextResponse.json({success:false,code:error.code,error:error.message},{status:400});
    return adminApiError(error);
  }
}
