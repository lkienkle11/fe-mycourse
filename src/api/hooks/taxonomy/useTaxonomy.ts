"use client";

import {
  getTaxonomyListKey,
  listTaxonomyService,
} from "@/api/callers/taxonomy";
import { useApiListQuery } from "@/api/hooks/shared";
import type {
  TaxonomyEntityMap,
  TaxonomyListFilters,
  TaxonomyResourceKey,
} from "@/types/taxonomy";

export function useTaxonomyList<K extends TaxonomyResourceKey>(
  resourceKey: K,
  filters: TaxonomyListFilters | null,
) {
  return useApiListQuery<TaxonomyEntityMap[K]>(
    filters ? getTaxonomyListKey(resourceKey, filters) : null,
    () => listTaxonomyService(resourceKey, filters as TaxonomyListFilters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 5 * 60 * 1000,
    },
  );
}
