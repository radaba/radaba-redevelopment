import "server-only";

import { resolveAuthenticatedUser } from "@/services/authentication/auth";
import { canAdministrate } from "@/features/admin/admin-authorization";

export class AdminSessionError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Authentication required." : "Administrator access required.");
  }
}

export async function resolveAdministrator() {
  let user;
  try {
    user = await resolveAuthenticatedUser();
  } catch {
    throw new AdminSessionError(401);
  }
  if (!canAdministrate(user)) throw new AdminSessionError(403);
  return user;
}
