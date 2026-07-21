/**
 * Server authenticated redirect hop loop (extracted from fetch-core).
 */

import type {
  FetchCoreInit,
  HttpMethod,
  ReplayableBody,
} from "./fetch-core-body";
import type { ApiErrorRequest } from "./fetch-error";
import {
  ApiRequestReplayError,
  redactApiErrorUrl,
  throwApiPolicyError,
} from "./fetch-error";
import { deleteHeader } from "./fetch-helpers";

export type SharedAbortLifecycle = {
  signal: AbortSignal | undefined;
  getAbortKind: () => "caller" | "timeout" | null;
};

const FOLLOW_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type ExecuteOnce = (
  init: FetchCoreInit,
  resolvedUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  attempt: 0 | 1,
  lifecycle: SharedAbortLifecycle,
) => Promise<Response>;

type AssertTrustedOrigin = (
  url: URL,
  trustedOrigin: string | undefined,
  request: ApiErrorRequest,
) => void;

function redirectRequest(
  url: string,
  method: HttpMethod,
  retried: boolean,
): ApiErrorRequest {
  return {
    url: redactApiErrorUrl(url),
    method,
    retried,
  };
}

function rewriteRedirectMethod(
  status: number,
  method: HttpMethod,
): { method: HttpMethod; dropBody: boolean } {
  if (status === 303) {
    if (method === "GET" || method === "HEAD") {
      return { method, dropBody: true };
    }
    return { method: "GET", dropBody: true };
  }
  if (status === 301 || status === 302) {
    if (method === "POST") {
      return { method: "GET", dropBody: true };
    }
    if (method === "GET" || method === "HEAD") {
      return { method, dropBody: true };
    }
    return { method, dropBody: false };
  }
  if (method === "GET" || method === "HEAD") {
    return { method, dropBody: true };
  }
  return { method, dropBody: false };
}

function resolveRedirectTargetUrl(
  location: string,
  currentUrl: string,
  currentMethod: HttpMethod,
  retried: boolean,
  trustedOrigin: string | undefined,
  assertTrustedOrigin: AssertTrustedOrigin,
): URL {
  let nextUrl: URL;
  try {
    nextUrl = new URL(location, currentUrl);
  } catch {
    throwApiPolicyError(
      "redirect-location-invalid",
      "Redirect Location invalid",
      redirectRequest(currentUrl, currentMethod, retried),
    );
  }

  if (nextUrl.protocol !== "http:" && nextUrl.protocol !== "https:") {
    throwApiPolicyError(
      "unsupported-protocol",
      "Redirect target protocol unsupported",
      redirectRequest(nextUrl.toString(), currentMethod, retried),
    );
  }
  if (nextUrl.username || nextUrl.password) {
    throwApiPolicyError(
      "embedded-credentials",
      "Redirect target has embedded credentials",
      redirectRequest(nextUrl.toString(), currentMethod, retried),
    );
  }
  assertTrustedOrigin(
    nextUrl,
    trustedOrigin,
    redirectRequest(nextUrl.toString(), currentMethod, retried),
  );
  return nextUrl;
}

function applyRedirectHopState(
  responseStatus: number,
  currentMethod: HttpMethod,
  nextHref: string,
  body: ReplayableBody,
  currentHeaders: Record<string, string>,
  retried: boolean,
): { method: HttpMethod; dropBody: boolean } {
  const rewrite = rewriteRedirectMethod(responseStatus, currentMethod);
  if (rewrite.dropBody) {
    deleteHeader(currentHeaders, "content-type");
    deleteHeader(currentHeaders, "content-length");
    deleteHeader(currentHeaders, "content-encoding");
    deleteHeader(currentHeaders, "content-language");
    deleteHeader(currentHeaders, "content-location");
  } else if (!body.replayable) {
    throw new ApiRequestReplayError({
      message: "Redirect requires replayable body",
      request: redirectRequest(nextHref, rewrite.method, retried),
    });
  }
  return rewrite;
}

async function releaseAbandonedRedirectBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    // Cancel failures must not mask typed redirect/policy errors.
  }
}

export async function followServerRedirects(
  init: FetchCoreInit,
  startUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  executeOnce: ExecuteOnce,
  assertTrustedOrigin: AssertTrustedOrigin,
  lifecycle: SharedAbortLifecycle,
): Promise<Response> {
  const maxHops = init.maxRedirectHops ?? 5;
  const visited = new Set<string>([startUrl]);
  const currentHeaders = { ...headers };
  const retried = Boolean(init.retried);
  let currentUrl = startUrl;
  let currentMethod = init.method;
  let dropBody = false;
  let hops = 0;

  while (true) {
    const response = await executeOnce(
      { ...init, method: currentMethod, redirect: "manual", timeoutMs: false },
      currentUrl,
      {
        ...body,
        bodyForAttempt: (attempt) =>
          dropBody ? null : body.bodyForAttempt(attempt),
      },
      currentHeaders,
      init.retried ? 1 : 0,
      lifecycle,
    );

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    // Only follow hop redirects. 304 and other 3xx must not become
    // redirect-location-missing.
    if (!FOLLOW_REDIRECT_STATUSES.has(response.status)) {
      return response;
    }

    hops += 1;
    if (hops > maxHops) {
      await releaseAbandonedRedirectBody(response);
      throwApiPolicyError(
        "redirect-hop-limit",
        "Redirect hop limit exceeded",
        redirectRequest(currentUrl, currentMethod, retried),
      );
    }

    const location = response.headers.get("location");
    if (!location) {
      await releaseAbandonedRedirectBody(response);
      throwApiPolicyError(
        "redirect-location-missing",
        "Redirect Location missing",
        redirectRequest(currentUrl, currentMethod, retried),
      );
    }

    let nextUrl: URL;
    try {
      nextUrl = resolveRedirectTargetUrl(
        location,
        currentUrl,
        currentMethod,
        retried,
        init.trustedOrigin,
        assertTrustedOrigin,
      );
    } catch (error) {
      await releaseAbandonedRedirectBody(response);
      throw error;
    }
    const nextHref = nextUrl.toString();
    if (visited.has(nextHref)) {
      await releaseAbandonedRedirectBody(response);
      throwApiPolicyError(
        "redirect-loop",
        "Redirect loop detected",
        redirectRequest(nextHref, currentMethod, retried),
      );
    }
    visited.add(nextHref);

    const hopStatus = response.status;
    // Intermediate hop response is abandoned — free the body/stream before
    // the next fetch so sockets are not held until GC.
    await releaseAbandonedRedirectBody(response);

    const rewrite = applyRedirectHopState(
      hopStatus,
      currentMethod,
      nextHref,
      body,
      currentHeaders,
      retried,
    );
    currentMethod = rewrite.method;
    dropBody = rewrite.dropBody;
    currentUrl = nextHref;
  }
}
