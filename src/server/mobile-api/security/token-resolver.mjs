const COOKIE_NAME = "__session";

function cookieValue(header, name) {
  for (const part of String(header || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export function resolveMobileToken(request) {
  const authorization = request.headers.get("authorization");
  if (authorization !== null) {
    const match = /^Bearer ([^\s]+)$/.exec(authorization);
    return match
      ? { ok: true, source: "authorization", token: match[1] }
      : { ok: false, source: "authorization", reason: "malformed_token" };
  }
  const token = cookieValue(request.headers.get("cookie"), COOKIE_NAME);
  if (token) return { ok: true, source: "cookie", token };
  return { ok: false, source: "none", reason: "missing_token" };
}
