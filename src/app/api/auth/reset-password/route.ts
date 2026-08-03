import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendPasswordResetEmail } from "@/services/authentication/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await sendPasswordResetEmail({ email: body?.email });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
