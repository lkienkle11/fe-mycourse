import { toast } from "sonner";
import { isApiHttpError, parseApiErrorEnvelope } from "@/api/core/fetch-error";
import { ApiErrorCode } from "@/constants/api-error-code";
import { errorCodesEn } from "@/messages/error-codes";

export type ApiErrorCodeKey = keyof typeof errorCodesEn;

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
