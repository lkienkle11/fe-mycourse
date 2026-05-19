/**
 * TypeScript mirror of the unified JSON envelope defined in
 * be/pkg/response/response.go and error codes in be/pkg/errcode/codes.go.
 */

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

/** Mirrors be/pkg/errcode/codes.go */
export const ApiErrorCode = {
  Success: 0,

  // Transport / parsing (1xxx)
  InvalidJSON: 1001,

  // Validation (2xxx)
  ValidationFailed: 2001,
  ValidationField: 2002,

  // Client / HTTP-shaped (3xxx)
  BadRequest: 3001,
  Unauthorized: 3002,
  Forbidden: 3003,
  NotFound: 3004,
  Conflict: 3005,
  TooManyRequests: 3006,

  // Auth (4xxx)
  EmailAlreadyExists: 4001,
  InvalidCredentials: 4002,
  WeakPassword: 4003,
  EmailNotConfirmed: 4004,
  UserDisabled: 4005,
  InvalidConfirmToken: 4006,
  RegistrationAbandoned: 4009,
  RegistrationEmailRateLimited: 4010,
  ConfirmationEmailSendFailed: 4011,

  // Server (9xxx)
  InternalError: 9001,
  Panic: 9998,
  Unknown: 9999,
} as const;

export type ApiErrorCodeValue =
  (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

// ---------------------------------------------------------------------------
// Response envelopes
// ---------------------------------------------------------------------------

/**
 * Standard envelope for every endpoint except /health.
 *
 * Mirrors:
 * ```go
 * type Response struct {
 *   Code    int    `json:"code"`
 *   Message string `json:"message"`
 *   Data    any    `json:"data"`
 * }
 * ```
 *
 * `code === 0` → success; any other value → application-level error.
 * `data` is `null` on error responses.
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
}

/**
 * Pagination metadata included in `data` when the endpoint uses OKPaginated.
 *
 * Mirrors:
 * ```go
 * type PageInfo struct {
 *   Page       int `json:"page"`
 *   PerPage    int `json:"per_page"`
 *   TotalPages int `json:"total_pages"`
 *   TotalItems int `json:"total_items"`
 * }
 * ```
 */
export interface ApiPageInfo {
  page: number;
  per_page: number;
  total_pages: number;
  total_items: number;
}

/**
 * Shape of `data` when the endpoint uses OKPaginated.
 *
 * Mirrors:
 * ```go
 * type PaginatedData struct {
 *   Result   any      `json:"result"`
 *   PageInfo PageInfo `json:"page_info"`
 * }
 * ```
 */
export interface ApiPaginatedData<T = unknown> {
  result: T;
  page_info: ApiPageInfo;
}

/** Convenience alias: paginated response ready to use as ApiResponse generic. */
export type ApiPaginatedResponse<T = unknown> = ApiResponse<
  ApiPaginatedData<T>
>;

/**
 * Envelope for GET /health.
 *
 * Mirrors:
 * ```go
 * type HealthResponse struct {
 *   Code    int    `json:"code"`
 *   Message string `json:"message"`
 *   Status  string `json:"status"`
 * }
 * ```
 */
export interface ApiHealthResponse {
  code: number;
  message: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Low-level result wrapper
// ---------------------------------------------------------------------------

/**
 * Return type for the low-level API helpers (apiFetch / apiPost / apiPut / apiDelete).
 *
 * `data`       – the parsed response body (generic T).
 * `statusCode` – HTTP status code (e.g. 200, 201, 204, 404, 500 …).
 * `headers`    – response headers normalised to `Record<string, string>`.
 *                `set-cookie` is excluded here; use `cookies` instead.
 * `cookies`    – cookies parsed from the `Set-Cookie` response header,
 *                keyed by cookie name with the raw value (attributes stripped).
 */
export interface ApiResult<T = unknown> {
  data: T;
  statusCode: number;
  headers: Record<string, string>;
  cookies: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns `true` when the response indicates a successful operation (code === 0). */
export function isApiSuccess<T>(
  res: ApiResponse<T>,
): res is ApiResponse<T> & { data: T } {
  return res.code === ApiErrorCode.Success;
}
