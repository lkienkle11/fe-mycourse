"use client";

import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import useSWRInfinite, { type SWRInfiniteConfiguration } from "swr/infinite";
import { apiFetch } from "@/api/transport/browser-api-methods";
import type { ApiPaginatedData, ApiPaginatedResponse } from "@/types/api";

type QueryKey = string | null;
type QueryFetcher<T> = () => Promise<T>;

type QueryState<T> = Pick<SWRResponse<T>, "isLoading" | "error" | "mutate">;

type ListQueryState<T> = QueryState<ApiPaginatedData<T[]>>;
type DetailQueryState<T> = QueryState<T>;

type InfiniteListGetKey<T> = (
  pageIndex: number,
  previousPageData: ApiPaginatedData<T[]> | null,
) => string | null;

export async function fetchPaginatedListByKey<T>(
  key: string,
): Promise<ApiPaginatedData<T[]>> {
  const { data } = await apiFetch<ApiPaginatedResponse<T[]>>(key);
  if (!data.data) {
    throw new Error(data.message || "Failed to load list");
  }
  return data.data;
}

export function useApiListQuery<T>(
  key: QueryKey,
  fetcher: QueryFetcher<ApiPaginatedData<T[]>>,
  options?: SWRConfiguration<ApiPaginatedData<T[]>>,
) {
  const swr = useSWR<ApiPaginatedData<T[]>>(key, fetcher, options);

  return {
    data: swr.data,
    rows: swr.data?.result ?? [],
    pageInfo: swr.data?.page_info,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  } satisfies {
    data: ApiPaginatedData<T[]> | undefined;
    rows: T[];
    pageInfo: ApiPaginatedData<T[]>["page_info"] | undefined;
  } & ListQueryState<T>;
}

export function useApiRowsQuery<T>(
  key: QueryKey,
  fetcher: QueryFetcher<T[]>,
  options?: SWRConfiguration<T[]>,
) {
  const swr = useSWR<T[]>(key, fetcher, options);

  return {
    rows: swr.data ?? [],
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  } satisfies {
    rows: T[];
  } & DetailQueryState<T[]>;
}

export function useApiDetailQuery<T>(
  key: QueryKey,
  fetcher: QueryFetcher<T>,
  options?: SWRConfiguration<T>,
) {
  const swr = useSWR<T>(key, fetcher, options);

  return {
    data: swr.data,
    isLoading: swr.isLoading,
    error: swr.error,
    mutate: swr.mutate,
  } satisfies {
    data: T | undefined;
  } & DetailQueryState<T>;
}

type UseApiInfiniteListQueryConfig<T> = {
  getKey: InfiniteListGetKey<T>;
  /** When set, merged `rows` skip items whose key already appeared on an earlier page. */
  getRowKey?: (item: T) => string;
  enabled?: boolean;
  options?: SWRInfiniteConfiguration<ApiPaginatedData<T[]>>;
};

export function useApiInfiniteListQuery<T>({
  getKey,
  getRowKey,
  enabled = true,
  options,
}: UseApiInfiniteListQueryConfig<T>) {
  const resolvedGetKey = useCallback(
    (pageIndex: number, previousPageData: ApiPaginatedData<T[]> | null) => {
      if (!enabled) {
        return null;
      }
      return getKey(pageIndex, previousPageData);
    },
    [enabled, getKey],
  );

  const swr = useSWRInfinite<ApiPaginatedData<T[]>>(
    resolvedGetKey,
    fetchPaginatedListByKey,
    {
      revalidateOnFocus: false,
      revalidateFirstPage: false,
      ...options,
    },
  );

  const pages = swr.data;
  const rows = useMemo(
    () => mergePaginatedPages(pages ?? [], getRowKey),
    [getRowKey, pages],
  );
  const resolvedPages = pages ?? [];
  const lastPage = resolvedPages[resolvedPages.length - 1];
  const totalPages = lastPage?.page_info?.total_pages ?? 1;
  const hasMore = swr.size < totalPages;
  const isLoading = swr.isLoading && resolvedPages.length === 0;
  const isLoadingMore =
    swr.isValidating &&
    resolvedPages.length > 0 &&
    resolvedPages.length < swr.size;

  const { isValidating, setSize, size } = swr;

  const loadMore = useCallback(() => {
    if (!hasMore || isValidating) {
      return;
    }
    void setSize(size + 1);
  }, [hasMore, isValidating, setSize, size]);

  return {
    rows,
    pages: resolvedPages,
    pageInfo: lastPage?.page_info,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error: swr.error,
    mutate: swr.mutate,
    setSize: swr.setSize,
    size: swr.size,
  };
}

function mergePaginatedPages<T>(
  pages: ApiPaginatedData<T[]>[],
  getRowKey?: (item: T) => string,
): T[] {
  if (!getRowKey) {
    return pages.flatMap((page) => page.result);
  }
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const page of pages) {
    for (const item of page.result) {
      const key = getRowKey(item);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}
