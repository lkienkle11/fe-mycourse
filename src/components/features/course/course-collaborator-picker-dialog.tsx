"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useCourseInstructorCandidates } from "@/api/hooks/course";
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

const PER_PAGE = 10;

type CourseCollaboratorPickerDialogProps = {
  courseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  onConfirm: (userIds: string[]) => Promise<void>;
};

export function CourseCollaboratorPickerDialog({
  courseId,
  open,
  onOpenChange,
  isSubmitting,
  onConfirm,
}: CourseCollaboratorPickerDialogProps) {
  const t = useTranslations("course.editor.collaborators.picker");
  const tc = useTranslations("instructor.common");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const filters = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      search,
    }),
    [page, search],
  );

  const { rows, pageInfo, isLoading } = useCourseInstructorCandidates(
    courseId,
    filters,
    open,
  );

  const footerProps = buildInstructorPageFooterFromInfo(
    pageInfo,
    page,
    setPage,
    {
      previousLabel: tc("previous"),
      nextLabel: tc("next"),
      buildPageOfLabel: (currentPage, totalPages) =>
        tc("pageOf", {
          page: String(currentPage),
          totalPages: String(totalPages),
        }),
    },
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchInput("");
      setSearch("");
      setPage(1);
      setSelectedIds(new Set());
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    try {
      await onConfirm([...selectedIds]);
      handleOpenChange(false);
    } catch {
      // Parent shows the error toast; keep dialog open and selection for retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] min-w-0 max-w-xl flex-col gap-4 overflow-x-hidden sm:w-full">
        <DialogHeader className="min-w-0">
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Input
            className="min-w-0"
            value={searchInput}
            placeholder={t("searchPlaceholder")}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applySearch();
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={applySearch}>
            {t("searchAction")}
          </Button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">{t("loading")}</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
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
                        id={`candidate-${candidate.user_id}`}
                        className="mt-0.5 shrink-0"
                        checked={checked}
                        onCheckedChange={(value) =>
                          toggleSelection(candidate.user_id, value === true)
                        }
                      />
                      <label
                        htmlFor={`candidate-${candidate.user_id}`}
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
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={selectedIds.size === 0 || isSubmitting}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? t("adding") : t("addSelected")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
