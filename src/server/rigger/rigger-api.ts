import { NextResponse } from "next/server";
import { RiggerSessionError } from "./rigger-session";
export function riggerApiError(error:unknown){
 if(error instanceof RiggerSessionError)return NextResponse.json({success:false,error:error.message},{status:error.status});
 console.error("Rigger read failed",error instanceof Error?error.message:"unknown");
 return NextResponse.json({success:false,error:"The Rigger request could not be completed."},{status:500});
}
