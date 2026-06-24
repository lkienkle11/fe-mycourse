import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { ApiErrorCode } from "@/constants/api-error-code";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import { getCookieValue, isServer } from "@/lib/utils";
import { useApiError } from "@/store/api-error-store";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import { parseMaxAgeForCookie } from "./axios-helpers";
import { rawPost } from "./raw-http";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;
const CLIENT_REFRESH_PROXY_PATH = "/api/auth/refresh";

// Resolved once at module load — used by the raw refresh helper.
const resolvedBaseURL =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? DEFAULT_BASE_URL;

export interface CreateInstanceConfig {
  /** Override the base URL (falls back to env vars, then localhost) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 10 000) */
  timeout?: number;
  /** Whether to send cookies cross-origin (default: true) */
  withCredentials?: boolean;
}

// ---------------------------------------------------------------------------
// Client-side mutex — prevents refresh stampede in the browser.
// NOT used on the server: each server request is isolated and sharing
// module-level state would mix up different users' tokens.
// ---------------------------------------------------------------------------

let isRefreshing = false;
type RefreshResolver = (accessToken: string | null) => void;
let pendingResolvers: RefreshResolver[] = [];

function scheduleAfterRefresh(resolver: RefreshResolver): void {
  pendingResolvers.push(resolver);
}

function flushRefreshQueue(accessToken: string | null): void {
  const resolvers = pendingResolvers;
  pendingResolvers = [];
  for (const r of resolvers) {
    r(accessToken);
  }
}

function readAuthorizationHeader(
  cfg: InternalAxiosRequestConfig,
): string | undefined {
  const h = cfg.headers;
  if (!h) return undefined;
  if (typeof (h as { get?: (n: string) => unknown }).get === "function") {
    const g = (h as { get: (n: string) => unknown }).get.bind(h);
    const a = g("Authorization") ?? g("authorization");
    if (typeof a === "string") return a;
    if (Array.isArray(a) && typeof a[0] === "string") return a[0];
    return undefined;
  }
  const o = h as Record<string, unknown>;
  const x = o.Authorization ?? o.authorization;
  return typeof x === "string" ? x : undefined;
}

/** True when the outbound request carried a non-empty JWT in `Authorization: Bearer …`. */
function requestSentNonEmptyBearerToken(
  cfg: InternalAxiosRequestConfig,
): boolean {
  const raw = readAuthorizationHeader(cfg);
  if (!raw?.trim()) return false;
  const m = /^Bearer\s+(\S+)/i.exec(raw.trim());
  return Boolean(m?.[1]);
}

type RefreshSessionPair = {
  refreshToken?: string;
  sessionId?: string;
};

/**
 * Server: reads HttpOnly refresh/session cookies via next/headers.
 * Client: returns `{}` so the browser sends HttpOnly cookies via withCredentials.
 */
async function getRefreshSessionPair(): Promise<RefreshSessionPair | null> {
  if (!isServer()) {
    return {};
  }
  const refreshToken = await getCookieValue("refresh_token");
  const sessionId = await getCookieValue("session_id");
  if (!refreshToken || !sessionId) return null;
  return { refreshToken, sessionId };
}

async function persistRefreshedAuthSession(
  tokens: RefreshTokenResponse,
  refreshMaxAge?: number,
): Promise<void> {
  // Client: BE Set-Cookie (AUTH_COOKIE_DOMAIN) already updates browser cookies.
  // Server: BE Set-Cookie stays on the Next.js server — relay tokens to the browser.
  if (!isServer()) {
    return;
  }
  const { syncAuthSessionCookiesAction } = await import(
    "@/actions/auth/sync-auth-session"
  );
  await syncAuthSessionCookiesAction({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    session_id: tokens.session_id,
    ...(refreshMaxAge !== undefined ? { refreshMaxAge } : {}),
  });
}

// ---------------------------------------------------------------------------
// Token refresh (plain axios — skips interceptors to avoid re-entry)
// ---------------------------------------------------------------------------

async function doTokenRefresh(
  pair: RefreshSessionPair,
): Promise<{ tokens: RefreshTokenResponse; refreshMaxAge?: number } | null> {
  try {
    if (!isServer()) {
      const { data: envelope } = await rawPost<
        ApiResponse<RefreshTokenResponse>,
        null
      >(CLIENT_REFRESH_PROXY_PATH, null, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        timeout: DEFAULT_TIMEOUT_MS,
      });
      const payload = envelope?.data;
      if (!payload?.access_token) return null;
      return { tokens: payload };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (pair.refreshToken && pair.sessionId) {
      headers["X-Refresh-Token"] = pair.refreshToken;
      headers["X-Session-Id"] = pair.sessionId;
    }
    const { data: envelope, setCookieHeaders } = await rawPost<
      ApiResponse<RefreshTokenResponse>,
      null
    >(resolvedBaseURL + API_PUBLIC_ROUTES.auth.refresh, null, {
      headers,
      withCredentials: true,
      timeout: DEFAULT_TIMEOUT_MS,
    });
    const payload = envelope?.data;
    if (!payload?.access_token) return null;
    const refreshMaxAge = parseMaxAgeForCookie(
      setCookieHeaders,
      "refresh_token",
    );
    return {
      tokens: payload,
      ...(refreshMaxAge !== undefined ? { refreshMaxAge } : {}),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Error reporting
// ---------------------------------------------------------------------------

function reportError(error: AxiosError): void {
  const statusCode: number = error.response?.status ?? 0;
  const body = error.response?.data as
    | { code?: number; message?: string }
    | undefined;
  const appCode: number = body?.code ?? ApiErrorCode.Unknown;
  const message: string = body?.message ?? error.message ?? "Unknown Error";
  const url: string = error.config?.url ?? "unknown";
  const method: string = (error.config?.method ?? "get").toUpperCase();

  console.error(
    `[API] ${method} ${url} → HTTP ${statusCode} | appCode=${appCode} | ${message}`,
  );

  if (isServer()) {
    return;
  }
  useApiError.getState().push({ statusCode, appCode, message, url, method });
}

// ---------------------------------------------------------------------------
// Instance factory
// ---------------------------------------------------------------------------

/**
 * Factory that creates a fully-configured Axios instance.
 *
 * Request interceptor:
 *   - Server: reads HttpOnly access_token via next/headers → Authorization header
 *     (Next.js server does not auto-forward browser cookies to the API).
 *   - Client: relies on withCredentials — BE reads access_token HttpOnly cookie.
 *
 * Response interceptor — silent token refresh on 401/403 + X-Token-Expired or
 * missing bearer when refresh/session cookies exist.
 */
export function createApiInstance(
  config?: CreateInstanceConfig,
): AxiosInstance {
  const baseURL = config?.baseURL ?? resolvedBaseURL;

  const instance = axios.create({
    baseURL,
    timeout: config?.timeout ?? DEFAULT_TIMEOUT_MS,
    withCredentials: config?.withCredentials ?? true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  // ---- Request interceptor: attach Bearer token (server-side only) ----
  instance.interceptors.request.use(
    async (cfg: InternalAxiosRequestConfig) => {
      if (isServer()) {
        const accessToken = await getCookieValue("access_token");
        if (accessToken) {
          cfg.headers.set("Authorization", `Bearer ${accessToken}`);
        }
      }
      return cfg;
    },
    (error) => Promise.reject(error),
  );

  // ---- Response interceptor: silent token refresh ----
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const status: number = error.response?.status ?? 0;
      const tokenExpired =
        error.response?.headers?.["x-token-expired"] === "true";
      const cfg = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      const missingAccessTokenRequest =
        status === 401 && !requestSentNonEmptyBearerToken(cfg);

      const shouldAttemptSilentRefresh =
        cfg &&
        !cfg._retry &&
        (status === 401 || status === 403) &&
        (tokenExpired || missingAccessTokenRequest);

      if (shouldAttemptSilentRefresh) {
        const pair = await getRefreshSessionPair();
        if (pair === null) {
          reportError(error);
          return Promise.reject(error);
        }

        cfg._retry = true;

        // ---- Server-side path (no shared mutex) ----
        if (isServer()) {
          const refreshResult = await doTokenRefresh(pair);
          if (!refreshResult) {
            reportError(error);
            return Promise.reject(error);
          }

          const { tokens, refreshMaxAge } = refreshResult;
          await persistRefreshedAuthSession(tokens, refreshMaxAge);
          cfg.headers.set("Authorization", `Bearer ${tokens.access_token}`);
          return instance(cfg);
        }

        // ---- Client-side path (with mutex) ----
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            scheduleAfterRefresh((newToken) => {
              if (!newToken) {
                reportError(error);
                return reject(error);
              }
              cfg.headers.set("Authorization", `Bearer ${newToken}`);
              resolve(instance(cfg));
            });
          });
        }

        isRefreshing = true;
        try {
          const refreshResult = await doTokenRefresh(pair);
          if (!refreshResult) {
            flushRefreshQueue(null);
            reportError(error);
            return Promise.reject(error);
          }

          const { tokens, refreshMaxAge } = refreshResult;
          await persistRefreshedAuthSession(tokens, refreshMaxAge);
          flushRefreshQueue(tokens.access_token);

          cfg.headers.set("Authorization", `Bearer ${tokens.access_token}`);
          return instance(cfg);
        } catch {
          flushRefreshQueue(null);
          reportError(error);
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }

      reportError(error);
      return Promise.reject(error);
    },
  );

  return instance;
}

/** Singleton instance used by default in all API helpers. */
export const apiInstance = createApiInstance();
