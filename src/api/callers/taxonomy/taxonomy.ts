import { apiDelete, apiFetch, apiPatch, apiPost } from "@/api/methods";
import { API_PRIVATE_ROUTES } from "@/constants/api-route";
import { apiListQueryToRecord, buildQueryParams } from "@/lib/utils";
import { getTaxonomyResourceConfig } from "@/lib/utils/taxonomy";
import type {
  ApiPaginatedData,
  ApiPaginatedResponse,
  ApiResponse,
} from "@/types/api";
import type {
  CreateTaxonomyPayloadMap,
  TaxonomyDetailQuery,
  TaxonomyEntityMap,
  TaxonomyListFilters,
  TaxonomyResourceKey,
  UpdateTaxonomyPayloadMap,
} from "@/types/taxonomy";

function taxonomyBasePath(resourceKey: TaxonomyResourceKey): string {
  return API_PRIVATE_ROUTES.taxonomy[resourceKey];
}

export function getTaxonomyListKey(
  resourceKey: TaxonomyResourceKey,
  filters: TaxonomyListFilters,
): string | null {
  const query = apiListQueryToRecord(filters);
  if (filters.search_by) query.search_by = filters.search_by;
  if (filters.search_value) query.search_value = filters.search_value;
  if (filters.include_images === false) query.include_images = "false";
  if (filters.locale) query.locale = filters.locale;
  return buildQueryParams(taxonomyBasePath(resourceKey), query);
}

export async function listTaxonomyService<K extends TaxonomyResourceKey>(
  resourceKey: K,
  filters: TaxonomyListFilters = {},
): Promise<ApiPaginatedData<TaxonomyEntityMap[K][]>> {
  const url = getTaxonomyListKey(resourceKey, filters);
  if (!url) {
    throw new Error("Invalid taxonomy list URL");
  }
  const { data } =
    await apiFetch<ApiPaginatedResponse<TaxonomyEntityMap[K][]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to load taxonomy list");
  }
  return data.data;
}

export function getTaxonomyDetailKey(
  resourceKey: TaxonomyResourceKey,
  id: string,
  query: TaxonomyDetailQuery = {},
): string | null {
  const params: Record<string, string> = {};
  if (query.locale) params.locale = query.locale;
  if (query.view) params.view = query.view;
  return buildQueryParams(
    API_PRIVATE_ROUTES.taxonomy.byId,
    Object.keys(params).length > 0 ? params : undefined,
    {
      segment: getTaxonomyResourceConfig(resourceKey).apiSegment,
      id: String(id),
    },
  );
}

export async function getTaxonomyDetailService<K extends TaxonomyResourceKey>(
  resourceKey: K,
  id: string,
  query: TaxonomyDetailQuery = {},
): Promise<TaxonomyEntityMap[K]> {
  const url = getTaxonomyDetailKey(resourceKey, id, query);
  if (!url) {
    throw new Error("Invalid taxonomy detail URL");
  }
  const { data } = await apiFetch<ApiResponse<TaxonomyEntityMap[K]>>(url);
  if (!data.data) {
    throw new Error(data.message || "Failed to load taxonomy item");
  }
  return data.data;
}

export async function createTaxonomyService<K extends TaxonomyResourceKey>(
  resourceKey: K,
  payload: CreateTaxonomyPayloadMap[K],
): Promise<TaxonomyEntityMap[K]> {
  const { data } = await apiPost<
    ApiResponse<TaxonomyEntityMap[K]>,
    CreateTaxonomyPayloadMap[K]
  >(taxonomyBasePath(resourceKey), payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to create taxonomy item");
  }
  return data.data;
}

export async function updateTaxonomyService<K extends TaxonomyResourceKey>(
  resourceKey: K,
  id: string,
  payload: UpdateTaxonomyPayloadMap[K],
): Promise<TaxonomyEntityMap[K]> {
  const url = buildQueryParams(API_PRIVATE_ROUTES.taxonomy.byId, undefined, {
    segment: getTaxonomyResourceConfig(resourceKey).apiSegment,
    id: String(id),
  });
  if (!url) {
    throw new Error("Invalid taxonomy update URL");
  }
  const { data } = await apiPatch<
    ApiResponse<TaxonomyEntityMap[K]>,
    UpdateTaxonomyPayloadMap[K]
  >(url, payload);
  if (!data.data) {
    throw new Error(data.message || "Failed to update taxonomy item");
  }
  return data.data;
}

export async function deleteTaxonomyService(
  resourceKey: TaxonomyResourceKey,
  id: string,
): Promise<void> {
  const url = buildQueryParams(API_PRIVATE_ROUTES.taxonomy.byId, undefined, {
    segment: getTaxonomyResourceConfig(resourceKey).apiSegment,
    id: String(id),
  });
  if (!url) {
    throw new Error("Invalid taxonomy delete URL");
  }
  await apiDelete<ApiResponse<null>>(url);
}
