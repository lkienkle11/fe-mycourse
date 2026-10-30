/**
 * Browser refresh single-flight (module-scoped Promise).
 * Client-safe — must not import server-only modules.
 *
 * No AbortSignal: public authenticated options intentionally omit signal,
 * and AuthRuntimeAdapter.refresh has no signal parameter.
 */

import {
  ApiNetworkError,
  ApiRefreshValidationError,
  ApiTimeoutError,
  isApiHttpError,
  sanitizeApiErrorCause,
} from "../core/fetch-error";
import { rawPost } from "../core/raw-http";
import {
  isSessionClearedRefreshResponse,
  isTransientRefreshStatus,
  parseExactBrowserRefreshProxySuccess,
} from "./auth-refresh";
import type { BrowserRefreshResult } from "./auth-runtime";

const CLIENT_REFRESH_PROXY_PATH = "/api/auth/refresh";
const REFRESH_LOCK_NAME = "mycourse:auth-refresh";
const DEFAULT_TIMEOUT_MS = 10_000;

let inflightRefresh: Promise<BrowserRefreshResult> | null = null;
let inflightOnSessionCleared: (() => void) | undefined;

/**
 * Tabs of one browser refresh one at a time so two tabs never rotate the same
 * refresh token concurrently. Without the Web Locks API the task runs unlocked.
 * The lock is released when the task settles; the task is bounded by the 10 s refresh timeout.
 */
async function runWithCrossTabRefreshLock(
  task: () => Promise<BrowserRefreshResult>,
): Promise<BrowserRefreshResult> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (!locks || typeof locks.request !== "function") return task();
  // `LockManager.request` is typed `Promise<T>` with `T` = the task's own promise, so await to flatten.
  return await locks.request(REFRESH_LOCK_NAME, task);
}

type BrowserRefreshProxySuccess = {
  code: number;
  message: string;
  data: { access_token: string };
};

function parseBrowserRefreshSuccess(data: unknown): BrowserRefreshResult {
  try {
    const parsed = parseExactBrowserRefreshProxySuccess(data);
    return { ok: true, accessToken: parsed.accessToken };
  } catch (error) {
    return {
      ok: false,
      cause: sanitizeApiErrorCause(error),
    };
  }
}

async function performBrowserRefresh(): Promise<BrowserRefreshResult> {
  try {
    // Absolute same-origin URL required — fetch-core rejects relative paths
    // without a baseURL (`invalid-url` before network).
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "";
    if (!origin) {
      return {
        ok: false,
        cause: sanitizeApiErrorCause(
          new ApiRefreshValidationError({
            reason: "invalid-envelope",
            message: "Browser refresh requires a window origin",
          }),
        ),
      };
    }

    const { data } = await rawPost<BrowserRefreshProxySuccess, null>(
      `${origin}${CLIENT_REFRESH_PROXY_PATH}`,
      null,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
        timeout: DEFAULT_TIMEOUT_MS,
      },
    );

    // rawPost throws ApiHttpError on non-2xx — success path only reaches here.
    return parseBrowserRefreshSuccess(data);
  } catch (error) {
    if (isApiHttpError(error)) {
      return {
        ok: false,
        cause: sanitizeApiErrorCause(
          new ApiRefreshValidationError({
            reason: "invalid-envelope",
            message: `Browser refresh HTTP ${error.response.status}`,
          }),
        ),
        ...(isSessionClearedRefreshResponse(error.response.data)
          ? { sessionCleared: true as const }
          : {}),
        ...(isTransientRefreshStatus(error.response.status)
          ? { outage: "server-error" as const }
          : {}),
      };
    }
    return {
      ok: false,
      cause: sanitizeApiErrorCause(error),
      ...(error instanceof ApiNetworkError || error instanceof ApiTimeoutError
        ? { outage: "network" as const }
        : {}),
    };
  }
}

/**
 * Join or create the single browser refresh promise.
 */
export function refreshBrowserSession(
  onSessionCleared?: () => void,
): Promise<BrowserRefreshResult> {
  // The first caller that provides a callback owns the notification, even when
  // it joins a refresh another caller started.
  inflightOnSessionCleared ??= onSessionCleared;
  if (!inflightRefresh) {
    inflightRefresh = runWithCrossTabRefreshLock(performBrowserRefresh)
      .then((result) => {
        if (!result.ok && result.sessionCleared) {
          try {
            inflightOnSessionCleared?.();
          } catch {
            // Notification is best effort; the refresh outcome is unchanged.
          }
        }
        return result;
      })
      .finally(() => {
        inflightRefresh = null;
        inflightOnSessionCleared = undefined;
      });
  }
  return inflightRefresh;
}

export function createBrowserProxyRuntimeAdapter(options?: {
  onSessionCleared?: () => void;
}): {
  kind: "browser-proxy";
  refresh: () => Promise<BrowserRefreshResult>;
} {
  return {
    kind: "browser-proxy",
    refresh: () => refreshBrowserSession(options?.onSessionCleared),
  };
}
