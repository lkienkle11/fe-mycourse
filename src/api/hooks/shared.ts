"use client";

import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import type { ApiPaginatedData } from "@/types/api";

type QueryKey = string | null;
type QueryFetcher<T> = () => Promise<T>;

type QueryState<T> = Pick<SWRResponse<T>, "isLoading" | "error" | "mutate">;

type ListQueryState<T> = QueryState<ApiPaginatedData<T[]>>;
type DetailQueryState<T> = QueryState<T>;

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
