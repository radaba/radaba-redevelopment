const jsonHeaders = { "content-type": "application/json" };

export function legacyJson(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...headers },
  });
}

export function legacyText(body, status = 200, headers = {}) {
  return new Response(body, { status, headers });
}

export function legacyEnvelope(code, message, data) {
  return { code, message, data };
}

export function legacySuccess(data, options = {}) {
  return legacyJson(
    legacyEnvelope(options.code ?? 200, options.message ?? "success", data),
    options.status ?? 200,
    options.headers,
  );
}

export function legacyFailure(status, message, data, options = {}) {
  return legacyJson(
    legacyEnvelope(options.code ?? status, message, data),
    status,
    options.headers,
  );
}

export function legacyRawError(error) {
  const data = error && typeof error.message === "string" ? error.message : undefined;
  return legacyFailure(500, "failed", data);
}
