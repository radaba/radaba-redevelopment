import packageJson from "../../../../package.json";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.APP_VERSION || packageJson.version,
    buildId: process.env.BUILD_ID || "unavailable",
    environment: process.env.RADABA_ENV || "unknown",
  }, { headers: { "cache-control": "no-store" } });
}
