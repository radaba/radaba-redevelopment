import { NextResponse } from "next/server";
import { logoutAuthenticatedSession } from "@/services/authentication/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await logoutAuthenticatedSession();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to sign out.",
      },
      { status: 400 },
    );
  }
}
