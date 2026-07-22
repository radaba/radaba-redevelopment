export interface LegacyUserLike {
  email?: string;
  privilege?: unknown;
  session_id?: string | null;
  uid?: string;
  [key: string]: unknown;
}

export function buildLegacyUserSessionPayload(user: LegacyUserLike, privilege?: unknown) {
  const normalizedEmail =
    typeof user?.email === "string"
      ? user.email.toLowerCase()
      : "";

  return {
    ...user,
    email: normalizedEmail,
    privilege: privilege ?? user?.privilege ?? [],
    session_id: user?.session_id ?? user?.uid ?? null,
  };
}

export default {
  buildLegacyUserSessionPayload,
};
