"use client";

import useSWR from "swr";
import {
  getTaxonomyListKey,
  listTaxonomyService,
} from "@/api/callers/taxonomy";
import type { ApiPaginatedData } from "@/types/api";
import type {
  TaxonomyEntityMap,
  TaxonomyListFilters,
  TaxonomyResourceKey,
} from "@/types/taxonomy";

export function useTaxonomyList<K extends TaxonomyResourceKey>(
  resourceKey: K,
  filters: TaxonomyListFilters,
) {
  const key = getTaxonomyListKey(resourceKey, filters);
  const swr = useSWR<ApiPaginatedData<TaxonomyEntityMap[K][]>>(
    key,
    () => listTaxonomyService(resourceKey, filters),
    { revalidateOnFocus: true },
  );

  return {
    data: swr.data,
    rows: swr.data?.result ?? [],
    pageInfo: swr.data?.page_info,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  };
}
