import "server-only";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
export interface AdministratorAuditRequestContext { requestIdentifier:string; ipAddress:string|null; userAgent:string|null }
export function administratorAuditRequestContext(request:NextRequest):AdministratorAuditRequestContext {const forwarded=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();return {requestIdentifier:request.headers.get("x-request-id")?.trim()||randomUUID(),ipAddress:forwarded||request.headers.get("x-real-ip")?.trim()||null,userAgent:request.headers.get("user-agent")?.trim()||null};}
