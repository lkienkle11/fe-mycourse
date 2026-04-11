export type CookieSameSite = "strict" | "lax" | "none";

export interface BuildHttpOnlyCookieOptionsInput {
  sameSite: CookieSameSite;
  isProduction: boolean;
  maxAge?: number;
  domain?: string;
}

export interface BuildCookieOptionsInput {
  sameSite: CookieSameSite;
  isProduction: boolean;
  httpOnly?: boolean;
  maxAge?: number;
  domain?: string;
}
