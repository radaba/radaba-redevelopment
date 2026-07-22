import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { signInWithEmailAndPassword } from "@/services/auth";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await signInWithEmailAndPassword({
      email: body?.email,
      password: body?.password,
    });

    await setSessionCookie(result.sessionCookie);

    return NextResponse.json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 401 },
    );
  }
}
