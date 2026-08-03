import {NextResponse} from "next/server";
import {resolveAdministrator} from "@/server/admin/admin-session";
import {adminApiError} from "@/server/admin/admin-api";
import {FirebaseTowerDependencyRepository} from "@/server/tower/firebase-tower-dependency-repository";
const valid=(key:string)=>/^[A-Za-z0-9_-]{1,160}$/.test(key);
export async function GET(_request:Request,{params}:{params:Promise<{towerKey:string}>}){try{await resolveAdministrator();const{towerKey}=await params;if(!valid(towerKey))return NextResponse.json({success:false,error:"Invalid Tower key."},{status:400});const data=await new FirebaseTowerDependencyRepository().get(towerKey);if(!data)return NextResponse.json({success:false,error:"Tower not found."},{status:404});return NextResponse.json({success:true,data},{headers:{"Cache-Control":"private, no-store"}})}catch(error){return adminApiError(error)}}