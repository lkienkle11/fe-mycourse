"use client";

import useSWR from "swr";
import { getMediaListKey, listMediaFiles } from "@/api/callers/media";
import type { ApiPaginatedData } from "@/types/api";
import type { MediaFile, MediaListFilters } from "@/types/media";

export function useMediaFiles(filters: MediaListFilters) {
  const key = getMediaListKey(filters);
  const swr = useSWR<ApiPaginatedData<MediaFile[]>>(
    key,
    () => listMediaFiles(filters),
    { revalidateOnFocus: false },
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
