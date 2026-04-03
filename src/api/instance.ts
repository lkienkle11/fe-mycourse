import axios, {
  type AxiosInstance,
  // type InternalAxiosRequestConfig,
} from "axios";
import { ApiErrorCode } from "@/types/api";
import { useApiError } from "@/store/api-error-store";

const DEFAULT_BASE_URL = "http://localhost:3000/api";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface CreateInstanceConfig {
  /** Override the base URL (falls back to env vars, then localhost) */
  baseURL?: string;
  /** Request timeout in milliseconds (default: 10 000) */
  timeout?: number;
  /** Whether to send cookies cross-origin (default: true) */
  withCredentials?: boolean;
}

/**
 * Factory that creates a fully-configured Axios instance.
 *
 * Priority for baseURL:
 *   config.baseURL → NEXT_PUBLIC_API_URL → API_URL → localhost fallback
 *
 * Interceptors added:
 *   - Request: placeholder — attach auth credentials here when ready.
 *   - Response: global error logger + pushes every failed request into
 *     the `useApiError` Zustand store so components can react without
 *     needing try-catch at every call site.
 */
export function createApiInstance(config?: CreateInstanceConfig): AxiosInstance {
  const baseURL =
    config?.baseURL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.API_URL ??
    DEFAULT_BASE_URL;

  const instance = axios.create({
    baseURL,
    timeout: config?.timeout ?? DEFAULT_TIMEOUT_MS,
    withCredentials: config?.withCredentials ?? true,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  instance.interceptors.request.use(
    (cfg) => {
      // TODO: attach auth credentials (e.g. from cookies/session) here when ready.
      // Do NOT read localStorage here — this interceptor runs on both client and
      // server; localStorage is unavailable on the server and reading it here
      // tightly couples auth state to the transport layer.
      return cfg;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const statusCode: number = error.response?.status ?? 0;
      const appCode: number =
        error.response?.data?.code ?? ApiErrorCode.Unknown;
      const message: string =
        error.response?.data?.message ?? error.message ?? "Unknown Error";
      const url: string = error.config?.url ?? "unknown";
      const method: string = (error.config?.method ?? "get").toUpperCase();

      console.error(
        `[API] ${method} ${url} → HTTP ${statusCode} | appCode=${appCode} | ${message}`,
      );

      // Push into the global error store — components read this via useApiError()
      useApiError.getState().push({ statusCode, appCode, message, url, method });

      return Promise.reject(error);
    },
  );

  return instance;
}

/** Singleton instance used by default in all API helpers. */
export const apiInstance = createApiInstance();
