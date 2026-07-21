import { isApiHttpError, parseApiErrorEnvelope } from "@/api/core/fetch-error";
import { ApiErrorCode } from "@/constants/api-error-code";
import {
  refreshMaxAgeFromBeSetCookie,
  setAuthSessionCookies,
} from "@/lib/utils/auth-session";
import type { ApiResponse } from "@/types/api";
import type { AuthActionResult, LoginResponse } from "@/types/auth/auth";

type LoginServiceResult = {
  data: ApiResponse<LoginResponse>;
  setCookieHeaders: string | string[] | undefined;
};

function parseRetryAfterSeconds(
  headers?: Record<string, string>,
): number | undefined {
  if (!headers) return undefined;
  const raw =
    headers["retry-after"] ??
    headers["Retry-After"] ??
    headers["x-mycourse-register-retry-after"] ??
    headers["X-Mycourse-Register-Retry-After"];
  if (!raw) return undefined;
  const sec = Number.parseInt(raw, 10);
  return Number.isFinite(sec) && sec > 0 ? sec : undefined;
}

export type MapAuthApiErrorOptions = {
  /** Register rate-limit paths may include Retry-After seconds. */
  includeRetryAfter?: boolean;
};

/**
 * Shared auth Server Action error mapper. Optional retry metadata for register.
 */
export function mapAuthApiError(
  error: unknown,
  options?: MapAuthApiErrorOptions,
): AuthActionResult {
  if (isApiHttpError(error)) {
    const parsed = parseApiErrorEnvelope(error.response.data);
    const result: AuthActionResult = {
      success: false,
      message: parsed.message,
      code: parsed.code,
    };
    if (options?.includeRetryAfter) {
      result.retryAfterSeconds = parseRetryAfterSeconds(error.response.headers);
    }
    return result;
  }
  const legacy = error as { response?: { data?: unknown } };
  const parsed = parseApiErrorEnvelope(legacy?.response?.data);
  return { success: false, message: parsed.message, code: parsed.code };
}

export async function finalizeAuthLoginAction(
  serviceCall: () => Promise<LoginServiceResult>,
): Promise<AuthActionResult> {
  try {
    const { data: response, setCookieHeaders } = await serviceCall();

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token, session_id } = response.data;
      if (
        !access_token?.trim() ||
        !refresh_token?.trim() ||
        !session_id?.trim()
      ) {
        return {
          success: false,
          message: "Malformed login payload",
          code: ApiErrorCode.Unknown,
        };
      }
      await setAuthSessionCookies({
        tokens: { access_token, refresh_token, session_id },
        refreshMaxAge: refreshMaxAgeFromBeSetCookie(setCookieHeaders),
      });
      return { success: true, message: response.message, code: response.code };
    }

    return {
      success: false,
      message: response.message,
      code: response.code,
    };
  } catch (error) {
    return mapAuthApiError(error);
  }
}
