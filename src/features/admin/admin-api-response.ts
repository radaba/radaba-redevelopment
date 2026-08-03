export async function readAdminApiResponse<T>(response: Response, fallback: string): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isJson = contentType.includes("application/json");
  if (!response.ok) {
    if (isJson) {
      const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
      throw new Error(
        typeof body?.error === "string" && body.error
          ? body.error
          : `${fallback} (${response.status}).`,
      );
    }
    const body = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 160);
    throw new Error(
      `${fallback} (${response.status}; ${contentType || "unknown content type"})${body ? `: ${body}` : "."}`,
    );
  }
  if (!isJson) {
    const body = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 160);
    throw new Error(
      `${fallback}: expected JSON but received ${contentType || "an unknown content type"}${body ? `: ${body}` : "."}`,
    );
  }
  return response.json() as Promise<T>;
}
