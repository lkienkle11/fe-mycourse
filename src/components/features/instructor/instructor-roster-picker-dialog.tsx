"use client";

import { useInstructorRosterCandidates } from "@/api/hooks/instructor";
import { UserMultiSelectPickerFeatureDialog } from "@/components/shared/user-multi-select-picker-feature-dialog";
import { useUserMultiSelectPickerState } from "@/hooks/user-picker/use-user-multi-select-picker-state";
import {
  useInstructorRosterPickerLabels,
  useUserPickerPaginationLabels,
} from "@/hooks/user-picker/use-user-picker-labels";
import type { UserPickerConfirmResult } from "@/types/user-picker";

type InstructorRosterPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: (
    userIds: string[],
  ) => Promise<UserPickerConfirmResult | undefined>;
};

export function InstructorRosterPickerDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: InstructorRosterPickerDialogProps) {
  const picker = useUserMultiSelectPickerState();
  const candidates = useInstructorRosterCandidates(picker.filters, open);
  const labels = useInstructorRosterPickerLabels();
  const paginationLabels = useUserPickerPaginationLabels();

  return (
    <UserMultiSelectPickerFeatureDialog
      open={open}
      onOpenChange={onOpenChange}
      isSubmitting={isSubmitting}
      onConfirm={onConfirm}
      picker={picker}
      candidates={candidates}
      labels={labels}
      paginationLabels={paginationLabels}
    />
  );
}
