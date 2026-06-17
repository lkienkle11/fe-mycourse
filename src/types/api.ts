/**
 * TypeScript mirror of the unified JSON envelope defined in
 * be/pkg/response/response.go and error codes in be/pkg/errcode/codes.go.
 */

// import type { ApiErrorCode } from "@/constants/api-error-code";

// export type ApiErrorCodeValue =
//   (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

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
 * Optional ACTIVE / INACTIVE filter on BE list endpoints (taxonomy, media, …).
 * Mirrors `status` query on `TaxonomyBaseFilter` and similar DTOs.
 */
export type ApiEntityStatus = "ACTIVE" | "INACTIVE";

/**
 * Shared paginated list query params for BE list APIs.
 * Use `apiListQueryToRecord()` when building query strings with `buildQueryParams`.
 * Taxonomy lists use `sort_desc`; media lists use `sort_order` and `category`.
 */
export interface ApiListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: ApiEntityStatus;
  sort_by?: string;
  /** Taxonomy-style lists (BE `sort_desc` boolean). */
  sort_desc?: boolean;
  /** Media-style lists (BE `sort_order` asc|desc). */
  sort_order?: "asc" | "desc";
  /** Media tab filter (BE `category`). */
  category?: string;
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
// export interface ApiHealthResponse {
//   code: number;
//   message: string;
//   status: string;
// }

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
