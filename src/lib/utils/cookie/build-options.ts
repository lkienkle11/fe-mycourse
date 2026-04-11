import type {
  BuildCookieOptionsInput,
  BuildHttpOnlyCookieOptionsInput,
} from "./types";

/**
 * Build HttpOnly cookie options dùng chung cho Server Actions.
 * @deprecated Dùng buildCookieOptions với httpOnly: false cho auth cookies mới.
 */
export function buildHttpOnlyCookieOptions(
  input: BuildHttpOnlyCookieOptionsInput,
) {
  const { sameSite, isProduction, maxAge, domain } = input;
  return {
    httpOnly: true as const,
    sameSite,
    secure: isProduction,
    path: "/" as const,
    ...(domain ? { domain } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}

/**
 * Build cookie options cho Server Actions.
 * httpOnly mặc định là false để client-side JS có thể đọc token từ cookie
 * và đính vào Authorization header.
 */
export function buildCookieOptions(input: BuildCookieOptionsInput) {
  const { sameSite, isProduction, httpOnly = false, maxAge, domain } = input;
  return {
    httpOnly,
    sameSite,
    secure: isProduction,
    path: "/" as const,
    ...(domain ? { domain } : {}),
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}
