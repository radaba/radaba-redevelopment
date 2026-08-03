export const MOBILE_SECURITY_MODES = Object.freeze([
  "legacy-compatible",
  "observe",
  "enforce",
]);

export function resolveMobileSecurityMode(environment = process.env) {
  const mode = environment.MOBILE_API_SECURITY_MODE || "legacy-compatible";
  if (!MOBILE_SECURITY_MODES.includes(mode)) {
    throw new Error("Invalid MOBILE_API_SECURITY_MODE");
  }
  if (environment.NODE_ENV === "production" && mode === "enforce") {
    throw new Error("Mobile API enforcement is not approved for production");
  }
  return mode;
}
