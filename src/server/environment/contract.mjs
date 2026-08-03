import { createHash } from "node:crypto";

export const RADABA_ENVIRONMENTS = Object.freeze([
  "local", "development", "staging", "production",
]);
const required = Object.freeze([
  "RADABA_ENV", "APP_URL", "APP_VERSION", "BUILD_ID",
  "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_DATABASE_URL", "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID", "FIREBASE_ADMIN_PROJECT_ID",
]);
const clean = (value) => typeof value === "string" ? value.trim() : "";
const fingerprint = (value) => createHash("sha256")
  .update(String(value)).digest("hex").slice(0, 12);

function validUrl(value, protocols = ["https:"]) {
  try { return protocols.includes(new URL(value).protocol); } catch { return false; }
}
function adminCredentialConfigured(env) {
  return Boolean(clean(env.FIREBASE_SERVICE_ACCOUNT) ||
    clean(env.GOOGLE_APPLICATION_CREDENTIALS) ||
    (clean(env.FIREBASE_ADMIN_CLIENT_EMAIL) &&
      clean(env.FIREBASE_ADMIN_PRIVATE_KEY)));
}
function validatePrivateKey(value, errors) {
  if (!clean(value)) return;
  const normalized = value.replaceAll("\\n", "\n");
  const begin = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
  const end = ["-----END ", "PRIVATE KEY-----"].join("");
  if (!normalized.includes(begin) || !normalized.includes(end)) {
    errors.push("FIREBASE_ADMIN_PRIVATE_KEY must be a PKCS#8 PEM value");
  }
}
function validateServiceAccount(value, clientProjectId, errors) {
  if (!clean(value)) return;
  try {
    const account = JSON.parse(value);
    if (!account || typeof account !== "object" ||
        !clean(account.project_id) || !clean(account.client_email) ||
        !clean(account.private_key)) {
      errors.push("FIREBASE_SERVICE_ACCOUNT is missing required fields");
      return;
    }
    if (clean(clientProjectId) && account.project_id !== clientProjectId) {
      errors.push("Firebase service-account and client project IDs must match");
    }
    validatePrivateKey(account.private_key, errors);
  } catch {
    errors.push("FIREBASE_SERVICE_ACCOUNT must be valid JSON");
  }
}

export function validateEnvironment(env, options = {}) {
  const errors = [];
  for (const name of required) {
    if (!clean(env[name])) errors.push(name + " is required");
  }
  const environment = clean(env.RADABA_ENV);
  if (!RADABA_ENVIRONMENTS.includes(environment)) {
    errors.push("RADABA_ENV must be one of: " + RADABA_ENVIRONMENTS.join(", "));
  }
  const appProtocols = environment === "local" ? ["http:", "https:"] : ["https:"];
  if (clean(env.APP_URL) && !validUrl(env.APP_URL, appProtocols)) {
    errors.push("APP_URL must be a valid environment-appropriate URL");
  }
  if (clean(env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) &&
      !validUrl(env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)) {
    errors.push("NEXT_PUBLIC_FIREBASE_DATABASE_URL must be an HTTPS URL");
  }
  if (clean(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) &&
      (env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.includes("://") ||
       env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.includes("/"))) {
    errors.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN must be a hostname");
  }
  if (clean(env.FIREBASE_ADMIN_PROJECT_ID) &&
      clean(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      env.FIREBASE_ADMIN_PROJECT_ID !== env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    errors.push("Firebase Admin and client project IDs must match");
  }
  validatePrivateKey(env.FIREBASE_ADMIN_PRIVATE_KEY, errors);
  validateServiceAccount(
    env.FIREBASE_SERVICE_ACCOUNT,
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    errors,
  );
  if (["staging", "production"].includes(environment) &&
      !adminCredentialConfigured(env)) {
    errors.push("A server-only Firebase Admin credential source is required");
  }
  if (["local", "development"].includes(environment)) {
    const identity = [
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    ].join(" ");
    if (/(^|[-_.\s])(prod|production|live)([-_.\s]|$)/i.test(identity)) {
      errors.push("Non-production environment appears to reference production Firebase resources");
    }
  }
  if (environment === "production" && env.NODE_ENV &&
      env.NODE_ENV !== "production") {
    errors.push("RADABA_ENV=production requires NODE_ENV=production");
  }
  if (options.requireRuntimeCredential && !adminCredentialConfigured(env)) {
    errors.push("Firebase Admin runtime credentials are required");
  }
  return {
    ok: errors.length === 0, errors, environment,
    fingerprint: clean(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      ? fingerprint([environment, env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET].join(":"))
      : null,
  };
}

export function assertEnvironment(env, options = {}) {
  const result = validateEnvironment(env, options);
  if (!result.ok) {
    throw new Error("Invalid Radaba environment:\n- " + result.errors.join("\n- "));
  }
  return Object.freeze(result);
}

export function validateBuildEnvironment(env) {
  if (env.RADABA_SKIP_ENV_VALIDATION === "true") {
    if (env.CI === "true") throw new Error("RADABA_SKIP_ENV_VALIDATION is forbidden in CI");
    return null;
  }
  return assertEnvironment(env);
}
