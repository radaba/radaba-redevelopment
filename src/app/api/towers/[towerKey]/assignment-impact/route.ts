import {NextResponse} from "next/server";
import {resolveAdministrator} from "@/server/admin/admin-session";
import {adminApiError} from "@/server/admin/admin-api";
import {FirebaseTowerCommandRepository} from "@/server/tower/firebase-tower-command-repository";
import {FirebaseTowerAssignmentImpactRepository} from "@/server/tower/firebase-tower-assignment-impact-repository";
import {TowerAssignmentImpactError,TowerAssignmentImpactService} from "@/server/tower/tower-assignment-impact-service";
const validKey=(value:string)=>/^[A-Za-z0-9_-]{1,160}$/.test(value);
export async function POST(request:Request,{params}:{params:Promise<{towerKey:string}>}){try{await resolveAdministrator();const{towerKey}=await params;if(!validKey(towerKey))return NextResponse.json({success:false,error:"Invalid Tower key."},{status:400});const body=await request.json().catch(()=>null),data=await new TowerAssignmentImpactService(new FirebaseTowerCommandRepository(),new FirebaseTowerAssignmentImpactRepository()).preview(towerKey,body);return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){if(error instanceof TowerAssignmentImpactError)return NextResponse.json({success:false,error:error.message,code:error.code},{status:error.code==="NOT_FOUND"?404:error.code==="CONFLICT"?409:400});return adminApiError(error)}}