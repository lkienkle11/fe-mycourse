"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiInfiniteListQuery } from "@/api/hooks/shared";
import {
  SEARCHABLE_SELECT_PER_PAGE,
  SEARCHABLE_SELECT_SEARCH_DEBOUNCE_MS,
} from "@/constants/searchable-select";
import type { ApiPaginatedData } from "@/types/api";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type FetchPageParams = {
  page: number;
  per_page: number;
  search?: string;
};

type UseSearchablePaginatedOptionsConfig<T> = {
  value: string;
  onValueChange: (value: string) => void;
  enabled?: boolean;
  getPageKey: (params: FetchPageParams) => string | null;
  mapToOption: (item: T) => SearchableSelectOption;
  excludeValues?: ReadonlySet<string>;
  onError?: (error: unknown) => void;
};

export function useSearchablePaginatedOptions<T>({
  value,
  onValueChange,
  enabled = true,
  getPageKey,
  mapToOption,
  excludeValues,
  onError,
}: UseSearchablePaginatedOptionsConfig<T>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pinnedOption, setPinnedOption] =
    useState<SearchableSelectOption | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const swrGetKey = useCallback(
    (pageIndex: number, previousPageData: ApiPaginatedData<T[]> | null) => {
      const page = pageIndex + 1;
      if (previousPageData) {
        const totalPages = previousPageData.page_info?.total_pages ?? 1;
        if (page > totalPages) {
          return null;
        }
      }
      return getPageKey({
        page,
        per_page: SEARCHABLE_SELECT_PER_PAGE,
        search: debouncedSearch || undefined,
      });
    },
    [debouncedSearch, getPageKey],
  );

  const getRowKey = useCallback(
    (item: T) => mapToOption(item).value,
    [mapToOption],
  );

  const {
    rows,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    mutate,
    setSize,
  } = useApiInfiniteListQuery<T>({
    getKey: swrGetKey,
    getRowKey,
    enabled: enabled && open,
  });

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const options = useMemo(() => {
    const mapped = rows.map(mapToOption);
    if (!excludeValues || excludeValues.size === 0) {
      return mapped;
    }
    return mapped.filter((option) => !excludeValues.has(option.value));
  }, [excludeValues, mapToOption, rows]);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return null;
    }
    if (pinnedOption?.value === value) {
      return pinnedOption.label;
    }
    return options.find((option) => option.value === value)?.label ?? null;
  }, [options, pinnedOption, value]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        clearDebounce();
        return;
      }
      setSearchInput(debouncedSearch);
    },
    [clearDebounce, debouncedSearch],
  );

  const handleSearchInputChange = useCallback(
    (nextValue: string) => {
      setSearchInput(nextValue);
      if (!open || !enabled) {
        return;
      }
      clearDebounce();
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedSearch(nextValue.trim());
        void setSize(1);
      }, SEARCHABLE_SELECT_SEARCH_DEBOUNCE_MS);
    },
    [clearDebounce, enabled, open, setSize],
  );

  const onOptionSelect = useCallback(
    (nextValue: string) => {
      if (!nextValue) {
        setPinnedOption(null);
        onValueChange("");
        return;
      }
      const option =
        options.find((entry) => entry.value === nextValue) ??
        rows.map(mapToOption).find((entry) => entry.value === nextValue);
      if (option) {
        setPinnedOption(option);
      }
      onValueChange(nextValue);
    },
    [mapToOption, onValueChange, options, rows],
  );

  const retry = useCallback(() => {
    if (!open || !enabled) {
      return;
    }
    void mutate();
  }, [enabled, mutate, open]);

  return {
    open,
    onOpenChange: handleOpenChange,
    searchInput,
    onSearchInputChange: handleSearchInputChange,
    options,
    selectedLabel,
    onOptionSelect,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    error,
    retry,
  };
}
