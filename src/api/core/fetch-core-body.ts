/**
 * Fetch-core shared types + replayable body builders.
 * Leaf module (no import from fetch-core) to avoid cycles.
 */

import { isServer } from "@/lib/utils/runtime";
import type { ApiResult } from "@/types/api";
import {
  type ApiErrorRequest,
  type ApiPolicyErrorCode,
  ApiRequestReplayError,
  throwApiPolicyError,
} from "./fetch-error";
import { deleteHeader } from "./fetch-helpers";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export type FetchCoreMode = "raw" | "authenticated";

export type FetchCoreRedirectMode = "error" | "manual" | "follow";

export type ReplayableBody = {
  bodyForAttempt(attempt: 0 | 1): BodyInit | null;
  bodyHeaders: Record<string, string>;
  replayable: boolean;
};

export type FetchCoreInit = {
  method: HttpMethod;
  url: string;
  baseURL?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  data?: unknown;
  timeoutMs?: number | false;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: FetchCoreRedirectMode;
  mode: FetchCoreMode;
  trustedOrigin?: string;
  retried?: boolean;
  allowBody?: boolean;
  maxRedirectHops?: number;
  next?: { revalidate?: number | false; tags?: string[] };
  /**
   * Default false. When true, gzip JSON bodies once for POST/PUT/PATCH into
   * replayable bytes (Content-Encoding: gzip). FormData and non-JSON raw bodies skip.
   */
  compress?: boolean;
  /**
   * Optional memo shared across refresh retry attempts so gzip (and other
   * replayable body work) runs once per logical request.
   */
  bodyMemo?: { current?: ReplayableBody };
};

export type FetchCoreSuccess<T> = ApiResult<T> & {
  ok: true;
};

export type FailedHttpResponse = {
  status: number;
  data: unknown;
  headers: Record<string, string>;
  cookies: Record<string, string>;
  setCookieHeaders: string | string[] | undefined;
  url: string;
  method: string;
};

export type FetchCoreOutcome<T> =
  | { ok: true; result: ApiResult<T> }
  | { ok: false; failed: FailedHttpResponse };

function policyError(
  code: ApiPolicyErrorCode,
  message: string,
  request: ApiErrorRequest,
  cause?: unknown,
): never {
  throwApiPolicyError(code, message, request, cause);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isUrlSearchParams(value: unknown): value is URLSearchParams {
  return (
    typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams
  );
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return value instanceof ArrayBuffer;
}

function isTypedArray(
  value: unknown,
): value is ArrayBufferView & { buffer: ArrayBuffer } {
  return ArrayBuffer.isView(value);
}

function isReadableStream(value: unknown): boolean {
  return (
    typeof ReadableStream !== "undefined" && value instanceof ReadableStream
  );
}

function snapshotFormData(form: FormData): FormData {
  const copy = new FormData();
  form.forEach((value, key) => {
    copy.append(key, value);
  });
  return copy;
}

function replay(
  bodyHeaders: Record<string, string>,
  bodyForAttempt: (attempt: 0 | 1) => BodyInit | null,
): ReplayableBody {
  return { bodyForAttempt, bodyHeaders, replayable: true };
}

function emptyBody(bodyHeaders: Record<string, string>): ReplayableBody {
  return replay(bodyHeaders, () => null);
}

/**
 * Gzip UTF-8 JSON once into a replayable ArrayBuffer.
 * Does not set Content-Length (Fetch/runtime owns framing).
 * Honors AbortSignal so timeout/caller abort can stop compression.
 */
async function gzipJsonBytesOnce(
  jsonBody: string,
  request: ApiErrorRequest,
  signal?: AbortSignal,
): Promise<ArrayBuffer> {
  if (typeof CompressionStream === "undefined") {
    policyError(
      "invalid-body",
      "CompressionStream is not available for gzip request bodies",
      request,
    );
  }
  if (signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const bytes = new TextEncoder().encode(jsonBody);
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const bufferPromise = new Response(stream).arrayBuffer();
  if (!signal) return bufferPromise;

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    bufferPromise.then(
      (buf) => {
        signal.removeEventListener("abort", onAbort);
        resolve(buf);
      },
      (err) => {
        signal.removeEventListener("abort", onAbort);
        reject(err);
      },
    );
  });
}

async function maybeGzipJsonReplay(
  bodyHeaders: Record<string, string>,
  jsonBody: string,
  compress: boolean,
  request: ApiErrorRequest,
  signal?: AbortSignal,
): Promise<ReplayableBody> {
  if (!compress) {
    return replay(bodyHeaders, () => jsonBody);
  }
  const gzipped = await gzipJsonBytesOnce(jsonBody, request, signal);
  bodyHeaders["content-encoding"] = "gzip";
  return replay(bodyHeaders, () => gzipped);
}

export async function buildAuthenticatedBody(
  data: unknown,
  allowBody: boolean,
  request: ApiErrorRequest,
  compress = false,
  signal?: AbortSignal,
): Promise<ReplayableBody> {
  const bodyHeaders: Record<string, string> = {
    accept: "application/json",
    "content-type": "application/json",
  };

  if (!allowBody || data === undefined) return emptyBody(bodyHeaders);

  if (isFormData(data)) {
    // FormData / file upload: never gzip even if compress is true.
    const entries = snapshotFormData(data);
    deleteHeader(bodyHeaders, "content-type");
    return replay(bodyHeaders, () => snapshotFormData(entries));
  }

  if (isReadableStream(data)) {
    throw new ApiRequestReplayError({
      message: "ReadableStream bodies are not replayable",
      request,
    });
  }

  let jsonBody: string;
  if (typeof data === "string") {
    const trimmed = data.trim();
    try {
      JSON.parse(trimmed);
      jsonBody = trimmed;
    } catch {
      jsonBody = JSON.stringify(data);
    }
  } else {
    jsonBody = JSON.stringify(data);
  }

  return maybeGzipJsonReplay(bodyHeaders, jsonBody, compress, request, signal);
}

export async function buildRawBody(
  data: unknown,
  allowBody: boolean,
  request: ApiErrorRequest,
  compress = false,
  signal?: AbortSignal,
): Promise<ReplayableBody> {
  const bodyHeaders: Record<string, string> = {
    accept: "application/json, text/plain, */*",
  };

  if (
    !allowBody ||
    data === undefined ||
    data === null ||
    data === 0 ||
    data === false
  ) {
    return emptyBody(bodyHeaders);
  }

  if (isReadableStream(data)) {
    throw new ApiRequestReplayError({
      message: "ReadableStream bodies are not replayable",
      request,
    });
  }

  if (isFormData(data)) {
    const entries = snapshotFormData(data);
    return replay(bodyHeaders, () => snapshotFormData(entries));
  }

  if (isUrlSearchParams(data)) {
    const snapshot = data.toString();
    bodyHeaders["content-type"] =
      "application/x-www-form-urlencoded;charset=utf-8";
    return replay(bodyHeaders, () => snapshot);
  }

  if (isBlob(data)) return replay(bodyHeaders, () => data);

  if (isArrayBuffer(data)) {
    const snapshot = data.slice(0);
    return replay(bodyHeaders, () => snapshot);
  }

  if (isTypedArray(data)) {
    const snapshot = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    );
    return replay(bodyHeaders, () => snapshot);
  }

  if (typeof data === "string") {
    if (isServer()) {
      // Node Fetch auto-sets text/plain for JS strings — use UTF-8 bytes instead.
      const bytes = new TextEncoder().encode(data);
      return replay(bodyHeaders, () => bytes);
    }
    return replay(bodyHeaders, () => data);
  }

  if (typeof data === "number" || typeof data === "boolean") {
    if (isServer()) {
      policyError(
        "invalid-body",
        "Primitive raw bodies are not allowed on the server",
        request,
      );
    }
    const snapshot = String(data);
    return replay(bodyHeaders, () => snapshot);
  }

  if (Array.isArray(data) || isPlainObject(data)) {
    const snapshot = JSON.stringify(data);
    bodyHeaders["content-type"] = "application/json";
    return maybeGzipJsonReplay(
      bodyHeaders,
      snapshot,
      compress,
      request,
      signal,
    );
  }

  policyError("invalid-body", "Unsupported raw body type", request);
}
