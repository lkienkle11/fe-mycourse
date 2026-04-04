import type { AxiosError } from "axios";
import { apiFetch, apiPost } from "@/api/methods";
import { API_PRIVATE_ROUTES, API_PUBLIC_ROUTES } from "@/constants/api-route";
import { buildQueryParams } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { LoginResponse, MeResponse } from "@/types/auth";

export interface LoginPayload {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface SignupPayload {
  email: string;
  password: string;
  display_name: string;
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
  const { data, cookies } = await apiPost<ApiResponse<LoginResponse>, LoginPayload>(
    API_PUBLIC_ROUTES.auth.login,
    payload,
  );
  return { data, cookies };
}
