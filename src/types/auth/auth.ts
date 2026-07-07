export type AuthActions = "none" | "login" | "signup" | "logout";

/** Result shape returned by auth server actions (login, confirm, OAuth, logout). */
export interface AuthActionResult {
  success: boolean;
  message: string;
  code: number;
  /** Seconds until retry when register is rate-limited (4010). */
  retryAfterSeconds?: number;
}

/**
 * Mirrors be/dto/auth.go → MeResponse.
 * Trả về từ GET /api/v1/me sau khi xác thực thành công.
 */
export interface MeResponse {
  user_id: string;
  user_code: string;
  email: string;
  display_name: string;
  avatar_url: string;
  email_confirmed: boolean;
  is_disabled: boolean;
  created_at: number;
  permissions: string[];
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  session_id: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  session_id: string;
}
