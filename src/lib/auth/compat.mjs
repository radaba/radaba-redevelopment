export function buildLegacyUserSessionPayload(user, privilege) {
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

const compatModule = {
  buildLegacyUserSessionPayload,
};

export default compatModule;
