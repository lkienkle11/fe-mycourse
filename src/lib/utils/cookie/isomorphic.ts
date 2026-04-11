import Cookies from "js-cookie";

export const isServer = typeof window === "undefined";

/**
 * Reads a cookie value.
 * - Client: via js-cookie.
 * - Server: via next/headers (requires an active Next.js request context).
 */
export async function getCookieValue(name: string): Promise<string | null> {
  if (!isServer) {
    return Cookies.get(name) ?? null;
  }
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(name)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Writes a cookie value.
 * - Client: via js-cookie.
 * - Server: via next/headers.
 *   Only works inside a Server Action or Route Handler (not a pure RSC).
 *   Failures are swallowed silently.
 */
export async function setCookieValue(
  name: string,
  value: string,
  options?: { maxAge?: number },
): Promise<void> {
  if (!isServer) {
    Cookies.set(name, value, {
      path: "/",
      sameSite: "lax",
      ...(options?.maxAge ? { expires: options.maxAge / 86400 } : {}),
    });
    return;
  }
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    store.set(name, value, {
      path: "/",
      sameSite: "lax",
      ...(options?.maxAge ? { maxAge: options.maxAge } : {}),
    });
  } catch {
    // In pure RSC contexts cookies are read-only — silently skip.
  }
}
