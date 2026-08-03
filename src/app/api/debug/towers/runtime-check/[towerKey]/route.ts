import {NextResponse} from "next/server";
import {resolveAdministrator} from "@/server/admin/admin-session";
import {FirebaseTowerWorkspaceRepository} from "@/server/tower-workspace/firebase-tower-workspace-repository";
import {FirebaseTowerCommandRepository} from "@/server/tower/firebase-tower-command-repository";
import {runtimeDebugEnabled,towerRuntimeFingerprint} from "@/lib/firebase/runtime-debug";

export async function GET(_request:Request,{params}:{params:Promise<{towerKey:string}>}){
 if(!runtimeDebugEnabled())return new NextResponse(null,{status:404});
 await resolveAdministrator();
 const{towerKey}=await params;
 if(!/^[A-Za-z0-9_-]{1,160}$/.test(towerKey))return NextResponse.json({success:false,error:"Invalid Tower key."},{status:400});
 const workspaceRepository=new FirebaseTowerWorkspaceRepository(),commandRepository=new FirebaseTowerCommandRepository();
 const[workspace,command]=await Promise.all([workspaceRepository.getTowerWorkspace(towerKey,{authorized:true}),commandRepository.findByKey(towerKey)]),fingerprint=towerRuntimeFingerprint();
 return NextResponse.json({success:true,data:{towerKey,path:`tower/${towerKey}`,workspaceExists:Boolean(workspace),commandExists:Boolean(command),workspaceFingerprint:fingerprint,commandFingerprint:fingerprint}},{headers:{"Cache-Control":"private, no-store"}});
}