import "server-only";

import {
  ADMINISTRATOR_PRIVILEGE_PATH,
  ADMINISTRATOR_ROLE,
  canAdministrate as runtimeCanAdministrate,
} from "./admin-authorization.mjs";

export interface AdministratorCandidate {
  role?: unknown;
  status?: unknown;
  privilege?: unknown;
}

export function canAdministrate(user: AdministratorCandidate): boolean {
  return runtimeCanAdministrate(user);
}

export { ADMINISTRATOR_PRIVILEGE_PATH, ADMINISTRATOR_ROLE };
