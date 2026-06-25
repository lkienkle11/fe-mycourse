"use client";

import { useMemo, useState } from "react";
import { USER_PICKER_PER_PAGE } from "@/constants/user-picker";
import type { UserPickerFilters } from "@/types/user-picker";

export function useUserMultiSelectPickerState() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const filters = useMemo<UserPickerFilters>(
    () => ({
      page,
      per_page: USER_PICKER_PER_PAGE,
      search: search || undefined,
    }),
    [page, search],
  );

  const applySearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const toggleSelection = (userId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  const removeFromSelection = (userIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const userId of userIds) {
        next.delete(userId);
      }
      return next;
    });
  };

  const resetPicker = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
    setSelectedIds(new Set());
  };

  return {
    filters,
    page,
    setPage,
    searchInput,
    setSearchInput,
    selectedIds,
    applySearch,
    toggleSelection,
    removeFromSelection,
    resetPicker,
  };
}
