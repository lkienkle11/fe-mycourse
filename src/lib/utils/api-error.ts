import { toast } from "sonner";
import {
  ApiNetworkError,
  ApiTimeoutError,
  isApiHttpError,
  parseApiErrorEnvelope,
} from "@/api/core/fetch-error";
import { ApiErrorCode } from "@/constants/api-error-code";
import { errorCodesEn } from "@/messages/error-codes";

export type ApiErrorCodeKey = keyof typeof errorCodesEn;

/**
 * Full-page failure category rendered by `StatusErrorPage`.
 * A 404 response is deliberately not one of these — it resolves to
 * `"unknown"` from `classifyApiError` below and falls back to the caller's
 * existing generic message, since this classifier has no reliable way to
 * distinguish "resource not found" from any other unmapped status.
 */
export type StatusErrorVariant =
  | "unauthorized"
  | "forbidden"
  | "server-error"
  | "network";

export type ExtractedApiError = {
  code: number;
  /** Dev reference only — never show to users. */
  message: string;
};

/** Pulls `code` and `message` from an API error envelope. */
export function extractApiError(error: unknown): ExtractedApiError {
  if (isApiHttpError(error)) {
    return parseApiErrorEnvelope(error.response.data);
  }
  const legacy = error as { response?: { data?: unknown } };
  return parseApiErrorEnvelope(legacy?.response?.data);
}

/** i18n key for a numeric API error code: `errors.codes.{code}`. */
export function resolveApiErrorMessageKey(code: number): string {
  return `errors.codes.${code}`;
}

function toApiErrorCodeKey(code: number): ApiErrorCodeKey {
  const key = String(code);
  if (key in errorCodesEn) {
    return key as ApiErrorCodeKey;
  }
  return String(ApiErrorCode.Unknown) as ApiErrorCodeKey;
}

/**
 * Translates an API error code via `errors.codes` namespace.
 * Unknown codes fall back to `errors.codes.9999`.
 */
export function translateApiErrorCode(
  tCodes: (key: ApiErrorCodeKey) => string,
  code: number,
): string {
  return tCodes(toApiErrorCodeKey(code));
}

type HttpStatusRule =
  | { status: number; variant: StatusErrorVariant }
  | { minStatus: number; maxStatus: number; variant: StatusErrorVariant };

/**
 * Ordered HTTP-status → variant rules, checked top to bottom. Adding a new
 * status code (or a new range) is a new entry here, not a new branch in
 * `classifyApiError` — keeps the classifier itself a flat, unchanging lookup
 * regardless of how many codes it grows to cover.
 */
const HTTP_STATUS_RULES: readonly HttpStatusRule[] = [
  { status: 401, variant: "unauthorized" },
  { status: 403, variant: "forbidden" },
  { minStatus: 500, maxStatus: 599, variant: "server-error" },
];

function matchHttpStatusRule(status: number): StatusErrorVariant | undefined {
  const rule = HTTP_STATUS_RULES.find((candidate) =>
    "status" in candidate
      ? candidate.status === status
      : status >= candidate.minStatus && status <= candidate.maxStatus,
  );
  return rule?.variant;
}

/**
 * Classifies a primary-data-load failure into a `StatusErrorPage` variant.
 * `ApiNetworkError`/`ApiTimeoutError` (no HTTP response received) map to
 * `network`; an HTTP response is looked up in `HTTP_STATUS_RULES` above.
 * Every other cause (including a 404 response, or a status this app hasn't
 * added a rule for yet) resolves to `"unknown"`, which callers fall back to
 * their existing generic message for.
 */
export function classifyApiError(
  error: unknown,
): StatusErrorVariant | "unknown" {
  if (error instanceof ApiNetworkError || error instanceof ApiTimeoutError) {
    return "network";
  }
  if (isApiHttpError(error)) {
    return matchHttpStatusRule(error.response.status) ?? "unknown";
  }
  return "unknown";
}

/** Shows a toast from API error code only — never passes BE message to users. */
export function toastApiError(
  tCodes: (key: ApiErrorCodeKey) => string,
  error: unknown,
): void {
  const { code, message } = extractApiError(error);
  if (process.env.NODE_ENV === "development") {
    console.debug("[API error]", { code, message });
  }
  toast.error(translateApiErrorCode(tCodes, code));
}
