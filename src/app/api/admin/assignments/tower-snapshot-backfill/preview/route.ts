import {NextResponse} from "next/server";
import {resolveAdministrator} from "@/server/admin/admin-session";
import {adminApiError} from "@/server/admin/admin-api";
import {AssignmentTowerSnapshotBackfillService} from "@/server/assignment/assignment-tower-snapshot-backfill-service";
export async function POST(){try{await resolveAdministrator();const data=await new AssignmentTowerSnapshotBackfillService().preview();return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){return adminApiError(error)}}
