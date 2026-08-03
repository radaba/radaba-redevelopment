import { notFound } from "next/navigation";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseCellsImagesReadRepository } from "@/server/cells-images/firebase-cells-images-repository";
import { CellEngineeringWorkspace } from "@/components/cells-images/cell-engineering-workspace";
export const dynamic="force-dynamic";
export default async function CellDetailPage({params}:{params:Promise<{cellId:string}>}) {
  const user=await resolveAuthenticatedUser();
  if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role)) return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Unauthorized</h1><p className="mt-2 text-sm">Active Assignment access is required.</p></section>;
  const {cellId}=await params;if(!/^[A-Za-z0-9_-]{1,160}$/.test(cellId))notFound();
  const repository=new FirebaseCellsImagesReadRepository();
  const cell=await repository.findCellByKey(cellId);if(!cell)notFound();
  const towerId=String(cell.tower_id??"").trim();
  const tower=towerId?await repository.findTowerVisitByTowerId(towerId):null;
  return <CellEngineeringWorkspace cell={cell} tower={tower}/>;
}
