"use client";

import { buildInstructorPageFooterFromInfo } from "@/components/features/instructor/instructor-action-controls";
import { InstructorListPagination } from "@/components/features/instructor/instructor-list-pagination";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ApiPageInfo } from "@/types/api";
import type {
  UserPickerCandidate,
  UserPickerConfirmResult,
  UserPickerLabels,
} from "@/types/user-picker";

export { USER_PICKER_PER_PAGE } from "@/constants/user-picker";

type UserMultiSelectPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: (
    userIds: string[],
  ) => Promise<UserPickerConfirmResult | undefined>;
  rows: UserPickerCandidate[];
  pageInfo: ApiPageInfo | null | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedIds: Set<string>;
  onToggleSelection: (userId: string, checked: boolean) => void;
  onRemoveFromSelection: (userIds: string[]) => void;
  onReset: () => void;
  onAfterPartialSuccess?: () => void | Promise<void>;
  labels: UserPickerLabels;
  paginationLabels: {
    previousLabel: string;
    nextLabel: string;
    buildPageOfLabel: (page: number, totalPages: number) => string;
  };
};

export function UserMultiSelectPickerDialog({
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
  rows,
  pageInfo,
  isLoading,
  page,
  onPageChange,
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  selectedIds,
  onToggleSelection,
  onRemoveFromSelection,
  onReset,
  onAfterPartialSuccess,
  labels,
  paginationLabels,
}: UserMultiSelectPickerDialogProps) {
  const footerProps = buildInstructorPageFooterFromInfo(
    pageInfo,
    page,
    onPageChange,
    paginationLabels,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onReset();
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    try {
      const result = await onConfirm([...selectedIds]);
      if (result && result.failedCount > 0) {
        onRemoveFromSelection(result.succeededIds);
        await onAfterPartialSuccess?.();
        return;
      }
      // Full success: revalidate picker candidates before close so reopen does not show stale rows.
      await onAfterPartialSuccess?.();
      handleOpenChange(false);
    } catch {
      // Parent shows the error toast; keep dialog open and selection for retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] min-w-0 max-w-xl flex-col gap-4 overflow-x-hidden sm:w-full">
        <DialogHeader className="min-w-0">
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Input
            className="min-w-0"
            value={searchInput}
            placeholder={labels.searchPlaceholder}
            onChange={(event) => onSearchInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onSearchSubmit();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={onSearchSubmit}>
            {labels.searchAction}
          </Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">
              {labels.loading}
            </p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{labels.empty}</p>
          ) : (
            <ul className="divide-y">
              {rows.map((candidate) => {
                const checked = selectedIds.has(candidate.user_id);
                return (
                  <li key={candidate.user_id} className="min-w-0">
                    <div
                      className={cn(
                        "flex min-w-0 items-start gap-3 p-3",
                        checked && "bg-muted/40",
                      )}
                    >
                      <Checkbox
                        id={`picker-${candidate.user_id}`}
                        className="mt-0.5 shrink-0"
                        checked={checked}
                        onCheckedChange={(value) =>
                          onToggleSelection(candidate.user_id, value === true)
                        }
                      />
                      <label
                        htmlFor={`picker-${candidate.user_id}`}
                        className="min-w-0 flex-1 cursor-pointer space-y-1 overflow-hidden"
                      >
                        <span
                          className="block truncate font-medium"
                          title={candidate.display_name}
                        >
                          {candidate.display_name}
                        </span>
                        <span
                          className="block break-all text-sm text-muted-foreground"
                          title={candidate.email}
                        >
                          {candidate.email}
                        </span>
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <InstructorListPagination {...footerProps} />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => handleOpenChange(false)}
          >
            {labels.cancel}
          </Button>
          <Button
            type="button"
            disabled={selectedIds.size === 0 || isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? labels.adding : labels.addSelected}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
