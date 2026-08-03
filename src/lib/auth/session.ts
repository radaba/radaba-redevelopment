import { cookies } from "next/headers";

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_EXPIRES_IN_MS = SESSION_MAX_AGE_SECONDS * 1000;

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, value, {
    ...sessionCookieOptions,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", { ...sessionCookieOptions, maxAge: 0 });
}
