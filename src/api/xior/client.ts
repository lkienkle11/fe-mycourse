/**
 * Xior-backed request executor.
 *
 * The surrounding Fetch-core policy still owns URL validation, body replay,
 * redirect security, timeout classification, and response metadata. Xior is
 * deliberately used as the HTTP lifecycle/serialization boundary while this
 * adapter supplies the already-normalized replayable body to native Fetch.
 */

import xior, {
  type XiorError,
  type XiorInstance,
  type XiorRequestConfig,
} from "xior";

import { isServer } from "@/lib/utils/runtime";
import type { FetchCoreInit, ReplayableBody } from "../core/fetch-core-body";
import type { SharedAbortLifecycle } from "../core/fetch-core-redirect";

type NextFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

type NextAwareXiorRequestConfig = XiorRequestConfig & {
  next?: NextFetchOptions;
};

type XiorFetchInit = RequestInit & {
  next?: NextFetchOptions;
};

/**
 * Xior skips its automatic body serializer when `data.append` is a function.
 * The custom fetch below replaces this sentinel with the replayable body that
 * Fetch-core already validated and prepared.
 */
const BODY_SENTINEL = Object.freeze({
  append: () => undefined,
});

const xiorInstance: XiorInstance = xior.create();

function isXiorHttpError(error: unknown): error is XiorError {
  return error instanceof Error && error.name === "XiorError";
}

function buildXiorConfig(
  init: FetchCoreInit,
  resolvedUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  attempt: 0 | 1,
  lifecycle: SharedAbortLifecycle,
): NextAwareXiorRequestConfig {
  let rawResponse: Response | undefined;

  const fetchImpl = async (
    input: RequestInfo | URL,
    requestInit?: XiorFetchInit,
  ): Promise<Response> => {
    const nativeInit: XiorFetchInit = {
      ...requestInit,
      body: body.bodyForAttempt(attempt),
      signal: lifecycle.signal,
    };

    rawResponse = await globalThis.fetch(input, nativeInit);

    // Xior consumes non-2xx response bodies while constructing XiorError.
    // Return a clone so the policy layer can still parse the original body
    // exactly once for ApiResult/ApiHttpError metadata.
    return rawResponse.clone();
  };

  const config: NextAwareXiorRequestConfig = {
    url: resolvedUrl,
    method: init.method,
    headers,
    data: BODY_SENTINEL,
    responseType: "original",
    signal: lifecycle.signal,
    redirect: init.redirect ?? "follow",
    fetch: fetchImpl,
  };

  if (init.credentials) config.credentials = init.credentials;
  if (init.cache) config.cache = init.cache;
  if (init.next && isServer()) config.next = init.next;

  Object.defineProperty(config, "__rawResponse", {
    configurable: true,
    enumerable: false,
    value: () => rawResponse,
  });

  return config;
}

type XiorConfigWithRawResponse = NextAwareXiorRequestConfig & {
  __rawResponse?: () => Response | undefined;
};

/**
 * Execute one attempt through Xior and return the untouched native Response.
 * Xior HTTP errors are intentionally converted back to their original
 * response so the existing Fetch-core error/metadata policy remains the sole
 * owner of ApiResult and ApiHttpError construction.
 */
export async function executeXiorOnce(
  init: FetchCoreInit,
  resolvedUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  attempt: 0 | 1,
  lifecycle: SharedAbortLifecycle,
): Promise<Response> {
  const config = buildXiorConfig(
    init,
    resolvedUrl,
    body,
    headers,
    attempt,
    lifecycle,
  );
  const getRawResponse = (config as XiorConfigWithRawResponse).__rawResponse;

  try {
    await xiorInstance.request(config);
  } catch (error) {
    const rawResponse = getRawResponse?.();
    if (isXiorHttpError(error) && rawResponse) return rawResponse;
    throw error;
  }

  const rawResponse = getRawResponse?.();
  if (rawResponse) return rawResponse;

  throw new TypeError("Xior completed without a native response");
}
