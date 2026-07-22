/**
 * Credential-bearing refresh POST — not part of public RawApiOptions.
 * Fail-closed redirect so X-Refresh-Token / X-Session-Id never follow off-origin.
 */

import type { ApiResult } from "@/types/api";
import { executeFetchCore, resolveTrustedOrigin } from "../core/fetch-core";

export type RawPostRefreshUpstreamInput = {
  refreshToken: string;
  sessionId: string;
  /** Resolved API base URL used to derive trusted origin. */
  baseURL: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

export async function rawPostRefreshUpstream<T>(
  url: string,
  input: RawPostRefreshUpstreamInput,
): Promise<ApiResult<T>> {
  return executeFetchCore<T>({
    method: "POST",
    url,
    headers: {
      "Content-Type": "application/json",
      "X-Refresh-Token": input.refreshToken,
      "X-Session-Id": input.sessionId,
    },
    data: null,
    timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    credentials: "include",
    cache: "no-store",
    mode: "raw",
    allowBody: true,
    redirect: "error",
    trustedOrigin: resolveTrustedOrigin(input.baseURL),
  });
}
