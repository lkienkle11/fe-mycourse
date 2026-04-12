import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";
import { API_PUBLIC_ROUTES } from "@/constants/api-route";
import { getCookieValue, isServer, setCookieValue } from "@/lib/utils";
import { ApiErrorCode } from "@/types/api";
import type { ApiResponse } from "@/types/api";
import type { RefreshTokenResponse } from "@/types/auth";
import { useApiError } from "@/store/api-error-store";
import { rawPost } from "./raw-http";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;

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

async function getRefreshSessionPair(): Promise<{
  refreshToken: string;
  sessionId: string;
} | null> {
  if (isServer) {
    const refreshToken = await getCookieValue("refresh_token");
    const sessionId = await getCookieValue("session_id");
    if (!refreshToken || !sessionId) return null;
    return { refreshToken, sessionId };
  }
  const refreshToken = Cookies.get("refresh_token");
  const sessionId = Cookies.get("session_id");
  if (!refreshToken || !sessionId) return null;
  return { refreshToken, sessionId };
}

// ---------------------------------------------------------------------------
// Token refresh (plain axios — skips interceptors to avoid re-entry)
// ---------------------------------------------------------------------------

async function doTokenRefresh(
  refreshToken: string,
  sessionId: string,
): Promise<RefreshTokenResponse | null> {
  try {
    const { data: envelope } = await rawPost<
      ApiResponse<RefreshTokenResponse>,
      null
    >(resolvedBaseURL + API_PUBLIC_ROUTES.auth.refresh, null, {
      headers: {
        "Content-Type": "application/json",
        "X-Refresh-Token": refreshToken,
        "X-Session-Id": sessionId,
      },
      timeout: DEFAULT_TIMEOUT_MS,
    });
    const payload = envelope?.data;
    if (!payload?.access_token) return null;
    return payload;
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

  // useApiError is a Zustand store — safe to call on server too (no-op if not hydrated).
  useApiError.getState().push({ statusCode, appCode, message, url, method });
}

// ---------------------------------------------------------------------------
// Instance factory
// ---------------------------------------------------------------------------

/**
 * Factory that creates a fully-configured Axios instance.
 *
 * Request interceptor (runs on both client and server):
 *   - Client: reads access_token via js-cookie → `Authorization: Bearer …`
 *   - Server: reads access_token via next/headers → `Authorization: Bearer …`
 *
 * Response interceptor — silent token refresh:
 *   - When the server sends `X-Token-Expired: true` (access JWT expired), or
 *   - On HTTP 401 when no `Authorization: Bearer …` was sent but `refresh_token`
 *     and `session_id` cookies exist (e.g. user cleared `access_token` only).
 *     The API still returns 401 without `X-Token-Expired` in that case — see BE
 *     `middleware/auth_jwt.go` (`missing bearer token` vs `token expired`).
 *   - Client: mutex prevents a stampede when many requests expire simultaneously.
 *     Queued requests wait for the single in-flight refresh and share the result.
 *   - Server: no module-level mutex (each request is isolated per user).
 *     Reads/writes cookies via next/headers (write is best-effort — works inside
 *     Server Actions and Route Handlers, silently skipped in pure RSC contexts).
 *   - On second failure (after retry) the error is surfaced and the promise rejects.
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

  // ---- Request interceptor: attach Bearer token ----
  instance.interceptors.request.use(
    async (cfg: InternalAxiosRequestConfig) => {
      const accessToken = await getCookieValue("access_token");
      if (accessToken) {
        cfg.headers.set("Authorization", `Bearer ${accessToken}`);
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
        if (!pair) {
          reportError(error);
          return Promise.reject(error);
        }

        cfg._retry = true;

        // ---- Server-side path (no shared mutex) ----
        if (isServer) {
          const tokens = await doTokenRefresh(
            pair.refreshToken,
            pair.sessionId,
          );
          if (!tokens) {
            reportError(error);
            return Promise.reject(error);
          }

          await setCookieValue("access_token", tokens.access_token, {
            maxAge: 15 * 60,
          });
          await setCookieValue("refresh_token", tokens.refresh_token);
          await setCookieValue("session_id", tokens.session_id);

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
          const tokens = await doTokenRefresh(
            pair.refreshToken,
            pair.sessionId,
          );
          if (!tokens) {
            flushRefreshQueue(null);
            reportError(error);
            return Promise.reject(error);
          }

          Cookies.set("access_token", tokens.access_token, {
            path: "/",
            sameSite: "lax",
            expires: 15 / 1440, // 15 minutes in days
          });
          Cookies.set("refresh_token", tokens.refresh_token, {
            path: "/",
            sameSite: "lax",
          });
          Cookies.set("session_id", tokens.session_id, {
            path: "/",
            sameSite: "lax",
          });

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
