/** HttpOnly auth cookie names (BFF-owned). DTO field names such as `access_token` in token payloads are not cookie names. */
export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const SESSION_ID_COOKIE = "session_id";

/**
 * HttpOnly cookie — absolute session expiry (Unix seconds).
 * FE-only, never sent to BE. Used when SSR refresh cannot read Set-Cookie headers.
 * Stores expiry, not relative Max-Age, so non-remember sessions cannot be extended
 * on fallback (BE uses remaining lifetime, not a renewed cap).
 */
export const AUTH_SESSION_EXPIRES_AT_COOKIE = "auth_session_expires_at";

/** Legacy cookie name (relative Max-Age) — cleared on read/write for migration. */
export const LEGACY_AUTH_SESSION_MAX_AGE_COOKIE = "auth_session_max_age";

/** Cookies a browser must never write from JS (see `setCookieValue`). */
export const AUTH_COOKIE_NAMES = [
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  SESSION_ID_COOKIE,
] as const;
