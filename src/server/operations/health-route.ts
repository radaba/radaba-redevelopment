import { NextResponse } from "next/server";
import { resolveOperationalConfig } from "@/server/operations/config.mjs";
import { evaluateOperationalHealth } from "@/server/operations/health.mjs";
import { MOBILE_ROUTE_POLICIES } from "@/server/mobile-api/security/policy.mjs";
export function snapshot(){const config=resolveOperationalConfig();return {config,health:evaluateOperationalHealth({config,compatibilityRouteCount:Object.keys(MOBILE_ROUTE_POLICIES).length})};}
export function response(body:unknown,status=200){return NextResponse.json(body,{status,headers:{"cache-control":"no-store"}});}