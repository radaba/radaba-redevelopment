import "server-only";
import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAccessAssignment } from "@/features/assignment/assignment-privilege";
export class AssignmentSessionError extends Error { constructor(public status: 401|403, message?: string) { super(message ?? (status===401?"Authentication required.":"Assignment access required.")); } }
export async function resolveAssignmentActor() { let user; try { user=await resolveAuthenticatedUser(); } catch { throw new AssignmentSessionError(401); } if(String(user.status).toLowerCase()!=="active"||!canAccessAssignment(user.privilege,user.role)) throw new AssignmentSessionError(403); return user; }
