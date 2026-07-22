/**
 * Xior HTTP lifecycle for raw and authenticated transports.
 *
 * Fetch-core remains the owner of project-specific URL, replay, redirect,
 * timeout and response metadata policy. Xior owns instance configuration and
 * request/response interceptor execution around each native Fetch attempt.
 */

import xior, {
  isXiorError,
  type XiorInstance,
  type XiorInterceptorRequestConfig,
  type XiorRequestConfig,
  type XiorResponse,
} from "xior";

import { isServer } from "@/lib/utils/runtime";
import type { FetchCoreInit, ReplayableBody } from "../core/fetch-core-body";

export type SharedAbortLifecycle = {
  signal: AbortSignal | undefined;
  getAbortKind: () => "caller" | "timeout" | null;
};

type NextFetchOptions = {
  revalidate?: number | false;
  tags?: string[];
};

type XiorFetchInit = RequestInit & {
  next?: NextFetchOptions;
};

export type XiorRequestExecutor = (
  init: FetchCoreInit,
  resolvedUrl: string,
  body: ReplayableBody,
  headers: Record<string, string>,
  attempt: 0 | 1,
  lifecycle: SharedAbortLifecycle,
) => Promise<Response>;

export type XiorHeaderResolver = (
  headers: Record<string, string>,
) => Promise<Record<string, string>> | Record<string, string>;

/** Internal marker so auth-runtime failures keep their pre-interceptor shape. */
export class XiorHeaderResolutionError extends Error {
  readonly original: unknown;

  constructor(original: unknown) {
    super("Xior request header resolution failed");
    this.name = "XiorHeaderResolutionError";
    this.original = original;
  }
}

type ResolvedHeadersObserver = (
  headers: Record<string, string>,
  init: FetchCoreInit,
) => void;

/**
 * Xior skips automatic serialization when `data.append` is a function. The
 * native Fetch adapter replaces this sentinel with Fetch-core's prepared body.
 */
const BODY_SENTINEL = Object.freeze({
  append: () => undefined,
});

class XiorExecutionState {
  rawResponse: Response | undefined;

  constructor(
    readonly init: FetchCoreInit,
    readonly body: ReplayableBody,
    readonly headers: Record<string, string>,
    readonly attempt: 0 | 1,
    readonly lifecycle: SharedAbortLifecycle,
  ) {}
}

type InternalXiorRequestConfig = XiorRequestConfig & {
  next?: NextFetchOptions;
  __mycourseExecution: XiorExecutionState;
};

function executionState(config: XiorRequestConfig): XiorExecutionState {
  const state = (config as Partial<InternalXiorRequestConfig>)
    .__mycourseExecution;
  if (state instanceof XiorExecutionState) return state;
  throw new TypeError("Xior request is missing MyCourse execution state");
}

function preserveHttpOutcome(error: unknown): XiorResponse {
  if (isXiorError(error) && error.response) return error.response;
  throw error;
}

function createXiorLifecycleInstance(
  resolveHeaders: XiorHeaderResolver,
  observeResolvedHeaders?: ResolvedHeadersObserver,
): XiorInstance {
  const instance = xior.create();

  instance.interceptors.request.use(
    async (
      config: XiorInterceptorRequestConfig,
    ): Promise<XiorInterceptorRequestConfig> => {
      const state = executionState(config);
      let headers: Record<string, string>;
      try {
        headers = await resolveHeaders({ ...state.headers });
      } catch (error) {
        throw new XiorHeaderResolutionError(error);
      }
      observeResolvedHeaders?.(headers, state.init);

      const fetchImpl = async (
        input: RequestInfo | URL,
        requestInit?: XiorFetchInit,
      ): Promise<Response> => {
        const nativeInit: XiorFetchInit = {
          ...requestInit,
          body: state.body.bodyForAttempt(state.attempt),
          signal: state.lifecycle.signal,
        };

        state.rawResponse = await globalThis.fetch(input, nativeInit);

        // Xior reads the clone while Fetch-core reads the original exactly
        // once for ApiResult and typed ApiHttpError metadata.
        return state.rawResponse.clone();
      };

      config.headers = headers;
      config.data = BODY_SENTINEL;
      config.responseType = "original";
      config.signal = state.lifecycle.signal;
      config.redirect = state.init.redirect ?? "follow";
      config.fetch = fetchImpl;

      if (state.init.credentials) config.credentials = state.init.credentials;
      if (state.init.mode === "authenticated") {
        config.cache = "no-store";
      } else if (state.init.cache) {
        config.cache = state.init.cache;
      }
      if (
        state.init.mode === "raw" &&
        state.init.method === "GET" &&
        state.init.next &&
        isServer()
      ) {
        config.next = state.init.next;
      }

      return config;
    },
  );

  instance.interceptors.response.use(
    (response) => response,
    preserveHttpOutcome,
  );

  return instance;
}

function createXiorRequestExecutor(
  resolveHeaders: XiorHeaderResolver,
  observeResolvedHeaders?: ResolvedHeadersObserver,
): XiorRequestExecutor {
  const instance = createXiorLifecycleInstance(
    resolveHeaders,
    observeResolvedHeaders,
  );

  return async (init, resolvedUrl, body, headers, attempt, lifecycle) => {
    const state = new XiorExecutionState(
      init,
      body,
      headers,
      attempt,
      lifecycle,
    );
    const config: InternalXiorRequestConfig = {
      url: resolvedUrl,
      method: init.method,
      headers,
      __mycourseExecution: state,
    };

    await instance.request(config);
    if (state.rawResponse) return state.rawResponse;

    throw new TypeError("Xior completed without a native response");
  };
}

const executeRawXiorRequest = createXiorRequestExecutor((headers) => headers);

/** Shared raw executor: no auth, refresh, reporter or Xior plugins. */
export const executeXiorOnce: XiorRequestExecutor = executeRawXiorRequest;

/**
 * Create an authenticated executor for one ApiTransport request. Keeping the
 * observer request-local avoids leaking Bearer metadata across concurrent
 * browser requests or request-scoped server transports.
 */
export function createAuthenticatedXiorRequestExecutor(
  resolveHeaders: XiorHeaderResolver,
  observeResolvedHeaders?: ResolvedHeadersObserver,
): XiorRequestExecutor {
  return createXiorRequestExecutor(resolveHeaders, observeResolvedHeaders);
}
