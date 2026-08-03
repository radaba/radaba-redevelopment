import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseCellsImagesReadRepository } from "@/server/cells-images/firebase-cells-images-repository";
import { CellsOperations } from "@/components/cells-images/cells-operations";

export const dynamic = "force-dynamic";
export default async function CellsPage({ searchParams }: { searchParams: Promise<{ cursor?: string | string[] }> }) {
  const user = await resolveAuthenticatedUser();
  if (String(user.status).toLowerCase() !== "active" || !canAccessAssignment(user.privilege, user.role)) return <Denied />;
  const raw = (await searchParams).cursor;
  const cursor = Array.isArray(raw) ? raw[0] : raw;
  if (cursor && !/^[A-Za-z0-9_-]{1,160}$/.test(cursor)) return <Invalid />;
  let result;
  try {
    result = await new FirebaseCellsImagesReadRepository().listCells(cursor, 50);
  } catch {
    throw new Error("Cell repository unavailable.");
  }
  return <CellsOperations result={result} cursor={cursor}/>;
}
function Denied(){return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Unauthorized</h1><p className="mt-2 text-sm">Active Assignment access is required to view Cells.</p></section>}
function Invalid(){return <section className="rounded-2xl border border-red-200 bg-red-50 p-6"><h1 className="text-xl font-semibold">Invalid page cursor</h1><p className="mt-2 text-sm">Return to the Cells directory and try again.</p></section>}
