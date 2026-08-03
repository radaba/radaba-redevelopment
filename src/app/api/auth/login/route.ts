import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createAuthenticatedSession } from "@/services/authentication/auth";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAuthenticatedSession(body?.idToken);

    await setSessionCookie(result.sessionCookie);

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        redirectTo: "/home/assignment",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: message === "Firebase ID token is required." ? 400 : 401 },
    );
  }
}
