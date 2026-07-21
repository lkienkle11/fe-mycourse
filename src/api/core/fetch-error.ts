/**
 * Typed transport errors for the native Fetch API layer.
 * Public consumers should prefer `isApiHttpError` / `isApiTransportError` guards.
 */

export type ApiErrorRequest = {
  url: string;
  method: string;
  retried: boolean;
};

export type ApiErrorResponse<T = unknown> = {
  status: number;
  data: T;
  headers: Record<string, string>;
};

export type ApiPolicyErrorCode =
  | "invalid-url"
  | "invalid-body"
  | "unsupported-protocol"
  | "embedded-credentials"
  | "untrusted-origin"
  | "invalid-timeout"
  | "invalid-cookie-header"
  | "invalid-option-combination"
  | "redirect-location-missing"
  | "redirect-location-invalid"
  | "redirect-loop"
  | "redirect-hop-limit"
  | "cache-profile-unknown"
  | "cache-profile-disabled"
  | "cache-profile-mismatch";

type ApiRequestErrorInput = {
  message: string;
  request: ApiErrorRequest;
  cause?: unknown;
};

abstract class ApiRequestErrorBase extends Error {
  readonly request: ApiErrorRequest;
  readonly cause?: unknown;

  constructor(input: ApiRequestErrorInput) {
    super(input.message);
    this.name = new.target.name;
    this.request = input.request;
    this.cause = input.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ApiPolicyError extends ApiRequestErrorBase {
  readonly kind = "policy" as const;
  readonly code: ApiPolicyErrorCode;

  constructor(input: {
    code: ApiPolicyErrorCode;
    message: string;
    request: ApiErrorRequest;
    cause?: unknown;
  }) {
    super(input);
    this.code = input.code;
  }
}

export class ApiHttpError<T = unknown> extends ApiRequestErrorBase {
  readonly kind = "http" as const;
  readonly response: ApiErrorResponse<T>;

  constructor(input: {
    message: string;
    response: ApiErrorResponse<T>;
    request: ApiErrorRequest;
    cause?: unknown;
  }) {
    super(input);
    this.response = input.response;
  }
}

export class ApiTimeoutError extends ApiRequestErrorBase {
  readonly kind = "timeout" as const;
}

export class ApiAbortError extends ApiRequestErrorBase {
  readonly kind = "abort" as const;
}

export class ApiNetworkError extends ApiRequestErrorBase {
  readonly kind = "network" as const;
}

export class ApiResponseParseError extends ApiRequestErrorBase {
  readonly kind = "response-parse" as const;
}

export class ApiRequestReplayError extends ApiRequestErrorBase {
  readonly kind = "request-replay" as const;
}

export class ApiRefreshRequiredError extends ApiRequestErrorBase {
  readonly kind = "refresh-required" as const;
}

export type ApiTransportError =
  | ApiHttpError
  | ApiTimeoutError
  | ApiAbortError
  | ApiNetworkError
  | ApiResponseParseError
  | ApiRequestReplayError
  | ApiRefreshRequiredError
  | ApiPolicyError;

export function isApiHttpError(value: unknown): value is ApiHttpError<unknown> {
  return value instanceof ApiHttpError;
}

export function isApiTransportError(
  value: unknown,
): value is ApiTransportError {
  return (
    value instanceof ApiHttpError ||
    value instanceof ApiTimeoutError ||
    value instanceof ApiAbortError ||
    value instanceof ApiNetworkError ||
    value instanceof ApiResponseParseError ||
    value instanceof ApiRequestReplayError ||
    value instanceof ApiRefreshRequiredError ||
    value instanceof ApiPolicyError
  );
}

export type ApiRefreshValidationReason =
  | "invalid-envelope"
  | "missing-access-token"
  | "missing-refresh-token"
  | "missing-session-id"
  | "cookie-persist-failed";

/** Internal-only refresh validation error — never expose tokens/headers. */
export class ApiRefreshValidationError extends Error {
  readonly kind = "refresh-validation" as const;
  readonly reason: ApiRefreshValidationReason;
  readonly cause?: unknown;

  constructor(input: {
    reason: ApiRefreshValidationReason;
    message: string;
    cause?: unknown;
  }) {
    super(input.message);
    this.name = "ApiRefreshValidationError";
    this.reason = input.reason;
    this.cause = input.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Keep origin + path; redact every query value; drop fragments.
 * Invalid input becomes the literal `invalid-url`.
 */
export function redactApiErrorUrl(rawUrl: string): string {
  try {
    const hasScheme = /^[a-z][a-z\d+\-.]*:/i.test(rawUrl);
    const url = hasScheme
      ? new URL(rawUrl)
      : new URL(rawUrl, "http://invalid.local");
    const keys: string[] = [];
    url.searchParams.forEach((_value, key) => {
      keys.push(key);
    });
    const query =
      keys.length === 0
        ? ""
        : `?${keys.map((k) => `${encodeURIComponent(k)}=[REDACTED]`).join("&")}`;
    if (hasScheme) {
      return `${url.origin}${url.pathname}${query}`;
    }
    return `${url.pathname}${query}`;
  } catch {
    return "invalid-url";
  }
}

type SanitizedCause = {
  kind: string;
  code?: string;
  reason?: string;
  message: string;
};

const SAFE_DIAGNOSTIC = "sanitized-transport-cause";

/** Allowlisted cause sanitizer — never copies message/stack/payload from unknown. */
export function sanitizeApiErrorCause(
  cause: unknown,
): SanitizedCause | undefined {
  if (cause == null) return undefined;
  if (cause instanceof ApiPolicyError) {
    return { kind: cause.kind, code: cause.code, message: SAFE_DIAGNOSTIC };
  }
  if (cause instanceof ApiRefreshValidationError) {
    return {
      kind: cause.kind,
      reason: cause.reason,
      message: SAFE_DIAGNOSTIC,
    };
  }
  if (isApiTransportError(cause)) {
    return { kind: cause.kind, message: SAFE_DIAGNOSTIC };
  }
  return { kind: "unknown", message: SAFE_DIAGNOSTIC };
}

/**
 * Runtime-validate API error envelopes. Only finite integer `code` and string
 * `message` are accepted; otherwise fall back to Unknown / safe defaults.
 */
export function parseApiErrorEnvelope(data: unknown): {
  code: number;
  message: string;
} {
  const unknownCode = 9999;
  if (!data || typeof data !== "object") {
    return { code: unknownCode, message: "Unexpected error occurred" };
  }
  const body = data as Record<string, unknown>;
  const code =
    typeof body.code === "number" &&
    Number.isInteger(body.code) &&
    Number.isFinite(body.code)
      ? body.code
      : unknownCode;
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message
      : "Unexpected error occurred";
  return { code, message };
}

/** Shared policy-error construction owner for fetch-core and body builders. */
export function throwApiPolicyError(
  code: ApiPolicyErrorCode,
  message: string,
  request: ApiErrorRequest,
  cause?: unknown,
): never {
  throw new ApiPolicyError({ code, message, request, cause });
}
