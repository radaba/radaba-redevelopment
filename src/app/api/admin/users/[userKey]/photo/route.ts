import { NextResponse } from "next/server";
import { firebaseAdminStorage } from "@/lib/firebase/admin";
import { resolveAdministrator } from "@/server/admin/admin-session";
import { FirebaseAdminDataRepository } from "@/server/admin/firebase-admin-data-repository";

export async function GET(_request: Request, { params }: { params: Promise<{ userKey: string }> }) {
  try {
    await resolveAdministrator();
    const user = await new FirebaseAdminDataRepository().findUser(
      decodeURIComponent((await params).userKey),
    );
    if (!user?.uid || !user.photoUrl) return new NextResponse(null, { status: 404 });
    const file = firebaseAdminStorage.bucket().file(`profile-photo/${user.uid}`),
      [exists] = await file.exists();
    if (!exists) return new NextResponse(null, { status: 404 });
    const [[bytes], [metadata]] = await Promise.all([file.download(), file.getMetadata()]);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": String(metadata.contentType ?? "application/octet-stream"),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
}
