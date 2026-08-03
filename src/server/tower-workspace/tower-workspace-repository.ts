import type { TowerWorkspaceRecord } from "@/features/tower-workspace/tower-workspace-types";
export interface TowerWorkspaceAuthorization { authorized:boolean }
export interface TowerWorkspaceRepository {
  getTowerWorkspace(towerKey:string, context:TowerWorkspaceAuthorization):Promise<TowerWorkspaceRecord|null>;
}
