"use client";

import { getMediaListKey, listMediaFiles } from "@/api/callers/media";
import { useApiListQuery } from "@/api/hooks/shared";
import type { MediaFile, MediaListFilters } from "@/types/media";

export function useMediaFiles(filters: MediaListFilters) {
  return useApiListQuery<MediaFile>(
    getMediaListKey(filters),
    () => listMediaFiles(filters),
    { revalidateOnFocus: false },
  );
}
