export type AdminErrorCode =
  | "MALFORMED"
  | "DENIED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_VALUE"
  | "UNAVAILABLE";

export class AdminCommandError extends Error {
  constructor(
    public readonly code: AdminErrorCode,
    message: string,
    public readonly fields?: Record<string,string>,
  ) {
    super(message);
    this.name = "AdminCommandError";
  }
}

export function adminErrorStatus(error: unknown): number {
  if (!(error instanceof AdminCommandError)) return 500;
  return {
    MALFORMED: 400,
    DENIED: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INVALID_VALUE: 422,
    UNAVAILABLE: 503,
  }[error.code];
}
