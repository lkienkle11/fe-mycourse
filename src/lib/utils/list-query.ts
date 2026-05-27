import type { ApiListQueryParams } from "@/types/api";

/**
 * Converts shared list query params to string key/values for `buildQueryParams`.
 * Omits empty optional fields.
 */
export function apiListQueryToRecord(
  params: ApiListQueryParams,
): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page != null) query.page = String(params.page);
  if (params.per_page != null) query.per_page = String(params.per_page);
  if (params.search) query.search = params.search;
  if (params.status) query.status = params.status;
  if (params.sort_by) query.sort_by = params.sort_by;
  if (params.sort_desc != null) {
    query.sort_desc = String(params.sort_desc);
  }
  if (params.sort_order) query.sort_order = params.sort_order;
  if (params.category) query.category = params.category;
  return query;
}
