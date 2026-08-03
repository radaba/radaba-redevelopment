import { notFound } from "next/navigation";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { FirebaseTowerWorkspaceRepository } from "@/server/tower-workspace/firebase-tower-workspace-repository";
import { TowerOperationsWorkspace } from "@/components/tower-workspace/tower-operations-workspace";
import {logTowerRuntime} from "@/lib/firebase/runtime-debug";
import { FirebaseAorReportRepository } from "@/server/report/firebase-report-repository";
import { canAdministrate } from "@/features/admin/admin-authorization";
export const dynamic = "force-dynamic";
export default async function TowerWorkspacePage({ params }: { params: Promise<{ towerKey:string }> }) {
  const user = await resolveAuthenticatedUser();
  if (String(user.status).toLowerCase() !== "active" || !canAccessAssignment(user.privilege, user.role)) return <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-semibold">Unauthorized</h1><p className="mt-2 text-sm">Active Assignment access is required to review this Tower workspace.</p></section>;
  const { towerKey } = await params;
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(towerKey)) notFound();
  let workspace;
  try { workspace = await new FirebaseTowerWorkspaceRepository().getTowerWorkspace(towerKey, { authorized: true }); logTowerRuntime("detail-page",towerKey,{path:`tower/${towerKey}`,exists:Boolean(workspace)}); }
  catch { throw new Error("Tower workspace repository unavailable."); }
  if (!workspace) notFound();
  const towerId = String(workspace.tower.tower_id ?? "").trim();
  const reports = towerId ? await new FirebaseAorReportRepository().getReportsForTower(towerId, { authorized: true }) : [];
  return <TowerOperationsWorkspace towerKey={towerKey} workspace={workspace} reports={reports} canEdit={canAdministrate(user)} canViewDependencies={canAdministrate(user)}/>;
}