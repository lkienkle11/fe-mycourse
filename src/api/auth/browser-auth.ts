/**
 * Browser refresh single-flight (module-scoped Promise).
 * Client-safe — must not import server-only modules.
 *
 * No AbortSignal: public authenticated options intentionally omit signal,
 * and AuthRuntimeAdapter.refresh has no signal parameter.
 */

import {
  ApiRefreshValidationError,
  isApiHttpError,
  sanitizeApiErrorCause,
} from "../core/fetch-error";
import { rawPost } from "../core/raw-http";
import { parseExactBrowserRefreshProxySuccess } from "./auth-refresh";
import type { BrowserRefreshResult } from "./auth-runtime";

const CLIENT_REFRESH_PROXY_PATH = "/api/auth/refresh";
const DEFAULT_TIMEOUT_MS = 10_000;

let inflightRefresh: Promise<BrowserRefreshResult> | null = null;

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
      };
    }
    return { ok: false, cause: sanitizeApiErrorCause(error) };
  }
}

/**
 * Join or create the single browser refresh promise.
 */
export function refreshBrowserSession(): Promise<BrowserRefreshResult> {
  if (!inflightRefresh) {
    inflightRefresh = performBrowserRefresh().finally(() => {
      inflightRefresh = null;
    });
  }
  return inflightRefresh;
}

export function createBrowserProxyRuntimeAdapter(): {
  kind: "browser-proxy";
  refresh: () => Promise<BrowserRefreshResult>;
} {
  return {
    kind: "browser-proxy",
    refresh: () => refreshBrowserSession(),
  };
}
