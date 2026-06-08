import type { AxiosError } from "axios";
import { apiDelete, apiFetch, apiPatch, apiPost } from "@/api/methods";
import { API_PRIVATE_ROUTES, API_PUBLIC_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse, MeResponse } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  display_name: string;
  locale: string;
}

/** @deprecated Use RegisterPayload */
export type SignupPayload = RegisterPayload;

export interface ConfirmPayload {
  token: string;
}

export interface UpdateMePayload {
  avatar_file_id?: string;
}

/**
 * SWR cache key cho endpoint GET /api/v1/me.
 * Export để useAuth hook dùng làm key — đảm bảo một chỗ duy nhất định nghĩa URL này.
 */
export const getMeEndpointKey = buildQueryParams(
  API_PRIVATE_ROUTES.user.getMe,
  undefined,
  undefined,
  undefined,
);

/**
 * Lấy thông tin user hiện tại đang đăng nhập.
 *
 * Cookie access_token được gửi tự động (withCredentials: true).
 * BE tự xử lý transparent token refresh nếu access_token hết hạn.
 *
 * - Trả về `MeResponse` nếu đã đăng nhập.
 * - Trả về `null` nếu chưa đăng nhập (HTTP 401) — không throw error.
 * - Throw error với các lỗi khác (network, 5xx, v.v.)
 */
export async function getMeService(): Promise<MeResponse | null> {
  const endpointKey = getMeEndpointKey;
  if (!endpointKey) return null;

  try {
    const { data } = await apiFetch<ApiResponse<MeResponse>>(endpointKey);
    return data.data;
  } catch (err) {
    const status = (err as AxiosError)?.response?.status;
    if (status === 401) return null;
    throw err;
  }
}

/**
 * Gọi API đăng nhập.
 *
 * BE trả về access_token, refresh_token trong JSON body và cũng set chúng
 * cùng session_id vào HttpOnly cookie của response.
 *
 * Vì request đi từ Next.js server → BE, Set-Cookie của BE không tự động
 * forward tới browser. Server Action sẽ đọc `cookies` ở đây và tự set lại
 * cookie cho client thông qua `next/headers`.
 *
 * @returns `{ data, cookies }` — data là ApiResponse body, cookies là
 *   Record<cookieName, value> parse từ Set-Cookie header của BE response.
 */
export async function loginService(payload: LoginPayload): Promise<{
  data: ApiResponse<LoginResponse>;
  cookies: Record<string, string>;
}> {
  const { data, cookies } = await apiPost<
    ApiResponse<LoginResponse>,
    LoginPayload
  >(API_PUBLIC_ROUTES.auth.login, payload);
  return { data, cookies };
}

/**
 * Gọi API đăng ký. BE trả 201, không có token — user xác nhận email trước.
 */
export async function registerService(
  payload: RegisterPayload,
): Promise<{ data: ApiResponse<null> }> {
  const { data } = await apiPost<ApiResponse<null>, RegisterPayload>(
    API_PUBLIC_ROUTES.auth.register,
    payload,
  );
  return { data };
}

/**
 * Gọi API xác nhận email — trả token pair giống login.
 */
export async function confirmService(
  payload: ConfirmPayload,
): Promise<{ data: ApiResponse<LoginResponse> }> {
  const { data } = await apiPost<ApiResponse<LoginResponse>, ConfirmPayload>(
    API_PUBLIC_ROUTES.auth.confirm,
    payload,
  );
  return { data };
}

/**
 * Gọi API refresh token.
 *
 * Truyền refresh token qua header X-Refresh-Token và session ID qua header
 * X-Session-Id.  BE trả về access_token mới, refresh_token mới và session_id
 * (không đổi) trong JSON body.
 *
 * Hàm này dùng `apiPost` thông thường — interceptor trong instance.ts sẽ tự
 * gọi hàm này khi phát hiện lỗi 401/403 + header X-Token-Expired.
 */
/**
 * Gọi API đăng xuất — revoke session trên BE và clear Set-Cookie.
 */
export async function logoutService(
  refreshToken: string,
  sessionId: string,
): Promise<{ data: ApiResponse<null> }> {
  const { data } = await apiPost<ApiResponse<null>>(
    API_PUBLIC_ROUTES.auth.logout,
    null,
    {
      headers: {
        "X-Refresh-Token": refreshToken,
        "X-Session-Id": sessionId,
      },
    },
  );
  return { data };
}

/** PATCH /api/v1/me — partial profile update (avatar_file_id). */
export async function patchMeService(
  payload: UpdateMePayload,
): Promise<MeResponse> {
  const endpointKey =
    buildQueryParams(
      API_PRIVATE_ROUTES.user.patchMe,
      undefined,
      undefined,
      undefined,
    ) ?? API_PRIVATE_ROUTES.user.patchMe;
  const { data } = await apiPatch<ApiResponse<MeResponse>, UpdateMePayload>(
    endpointKey,
    payload,
  );
  if (!data.data) {
    throw new Error("PATCH /me returned no data");
  }
  return data.data;
}

/** DELETE /api/v1/me — soft-delete account. */
export async function deleteMeService(): Promise<void> {
  const endpointKey =
    buildQueryParams(
      API_PRIVATE_ROUTES.user.deleteMe,
      undefined,
      undefined,
      undefined,
    ) ?? API_PRIVATE_ROUTES.user.deleteMe;
  await apiDelete<ApiResponse<null>>(endpointKey);
}

/** DELETE /api/v1/me/hard — hard-delete account. */
export async function hardDeleteMeService(): Promise<void> {
  const endpointKey =
    buildQueryParams(
      API_PRIVATE_ROUTES.user.hardDeleteMe,
      undefined,
      undefined,
      undefined,
    ) ?? API_PRIVATE_ROUTES.user.hardDeleteMe;
  await apiDelete<ApiResponse<null>>(endpointKey);
}

/** GET /api/v1/me/permissions — permission names for current user. */
export async function getMyPermissionsService(): Promise<string[]> {
  const endpointKey =
    buildQueryParams(
      API_PRIVATE_ROUTES.user.getMyPermissions,
      undefined,
      undefined,
      undefined,
    ) ?? API_PRIVATE_ROUTES.user.getMyPermissions;
  const { data } = await apiFetch<ApiResponse<string[]>>(endpointKey);
  return data.data ?? [];
}

// export async function refreshTokenService(
//   refreshToken: string,
//   sessionId: string,
// ): Promise<ApiResponse<RefreshTokenResponse>> {
//   const { data } = await apiPost<ApiResponse<RefreshTokenResponse>>(
//     API_PUBLIC_ROUTES.auth.refresh,
//     null,
//     {
//       headers: {
//         "X-Refresh-Token": refreshToken,
//         "X-Session-Id": sessionId,
//       },
//     },
//   );
//   return data;
// }
