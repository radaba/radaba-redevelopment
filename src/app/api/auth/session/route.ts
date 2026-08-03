import { NextResponse } from "next/server";
import { getSessionUser } from "@/services/authentication/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { user } = await getSessionUser();

    return NextResponse.json({
      success: true,
      data: { user },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 },
    );
  }
}
