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

export function mapAuthAxiosError(error: unknown): AuthActionResult {
  const axiosError = error as {
    response?: { data?: { code?: number; message?: string } };
  };
  const code = axiosError?.response?.data?.code ?? ApiErrorCode.Unknown;
  const message =
    axiosError?.response?.data?.message ?? "Unexpected error occurred";
  return { success: false, message, code };
}

export async function finalizeAuthLoginAction(
  serviceCall: () => Promise<LoginServiceResult>,
): Promise<AuthActionResult> {
  try {
    const { data: response, setCookieHeaders } = await serviceCall();

    if (response.code === ApiErrorCode.Success && response.data) {
      const { access_token, refresh_token, session_id } = response.data;
      await setAuthSessionCookies({
        tokens: { access_token, refresh_token, session_id },
        refreshMaxAge: refreshMaxAgeFromBeSetCookie(setCookieHeaders),
      });
      return { success: true, message: response.message, code: response.code };
    }

    return { success: false, message: response.message, code: response.code };
  } catch (error: unknown) {
    return mapAuthAxiosError(error);
  }
}
