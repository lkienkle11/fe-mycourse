"use client";

import { UserMultiSelectPickerDialog } from "@/components/shared/user-multi-select-picker-dialog";
import type { useUserMultiSelectPickerState } from "@/hooks/user-picker/use-user-multi-select-picker-state";
import type {
  UserPickerConfirmResult,
  UserPickerLabels,
  UserPickerListQuery,
  UserPickerPaginationLabels,
} from "@/types/user-picker";

type PickerState = ReturnType<typeof useUserMultiSelectPickerState>;

type UserMultiSelectPickerFeatureDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: (
    userIds: string[],
  ) => Promise<UserPickerConfirmResult | undefined>;
  picker: PickerState;
  candidates: UserPickerListQuery;
  labels: UserPickerLabels;
  paginationLabels: UserPickerPaginationLabels;
};

export function UserMultiSelectPickerFeatureDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
  picker,
  candidates,
  labels,
  paginationLabels,
}: UserMultiSelectPickerFeatureDialogProps) {
  const handleAfterPartialSuccess = async () => {
    await candidates.mutate();
  };

  return (
    <UserMultiSelectPickerDialog
      open={open}
      onOpenChange={onOpenChange}
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      rows={candidates.rows}
      pageInfo={candidates.pageInfo}
      isLoading={candidates.isLoading}
      page={picker.page}
      onPageChange={picker.setPage}
      searchInput={picker.searchInput}
      onSearchInputChange={picker.setSearchInput}
      onSearchSubmit={picker.applySearch}
      selectedIds={picker.selectedIds}
      onToggleSelection={picker.toggleSelection}
      onRemoveFromSelection={picker.removeFromSelection}
      onReset={picker.resetPicker}
      onAfterPartialSuccess={handleAfterPartialSuccess}
      labels={labels}
      paginationLabels={paginationLabels}
    />
  );
}
