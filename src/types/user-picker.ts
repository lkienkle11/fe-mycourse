import type { ApiListQueryParams, ApiPageInfo } from "@/types/api";

/** Shared row shape for multi-select user picker dialogs. */
export type UserPickerCandidate = {
  user_id: string;
  display_name: string;
  email: string;
  avatar_file_id?: string;
  avatar_url?: string;
};

export type UserPickerFilters = ApiListQueryParams;

export type UserPickerLabels = {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchAction: string;
  loading: string;
  empty: string;
  cancel: string;
  addSelected: string;
  adding: string;
};

/** Returned by onConfirm when some picks succeeded and some failed. */
export type UserPickerConfirmResult = {
  succeededIds: string[];
  failedCount: number;
};

export type UserPickerPaginationLabels = {
  previousLabel: string;
  nextLabel: string;
  buildPageOfLabel: (page: number, totalPages: number) => string;
};

export type UserPickerListQuery = {
  rows: UserPickerCandidate[];
  pageInfo: ApiPageInfo | null | undefined;
  isLoading: boolean;
  mutate: () => Promise<unknown>;
};
