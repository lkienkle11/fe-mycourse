"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  permanentDeleteTrashedCourseService,
  restoreTrashedCourseService,
} from "@/api/callers/course";
import { useTrashedCourses } from "@/api/hooks/course";
import { buildCourseAdminListColumns } from "@/components/features/course/course-admin-list-columns";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toastApiError } from "@/lib/utils/api-error";
import type { CourseListItem } from "@/types/course";

export function CourseAdminTrashPage() {
  const t = useTranslations("course.trash");
  const tErrors = useTranslations("errors.codes");
  const { rows, isLoading, mutate } = useTrashedCourses();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CourseListItem | null>(null);

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () =>
      buildCourseAdminListColumns({
        course: t("columns.course"),
        owner: t("columns.owner"),
        version: t("columns.version"),
      }),
    [t],
  );

  const handleRestore = async (course: CourseListItem) => {
    setPendingActionId(course.id);
    try {
      await restoreTrashedCourseService(course.id);
      toast.success(t("toast.restored"));
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setPendingActionId(null);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setPendingActionId(deleteTarget.id);
    try {
      await permanentDeleteTrashedCourseService(deleteTarget.id);
      toast.success(t("toast.deleted"));
      setDeleteTarget(null);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setPendingActionId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          actionsHeader={t("actions.menu")}
          emptyMessage={t("empty")}
          renderActions={(row) => (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={pendingActionId === row.id}
                  aria-label={t("actions.menu")}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void handleRestore(row)}>
                  {t("actions.restore")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteTarget(row)}
                >
                  {t("actions.permanentDelete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        />
      )}

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        isLoading={pendingActionId != null}
        title={t("confirmDelete.title")}
        description={t("confirmDelete.description", {
          title: deleteTarget?.title ?? "",
        })}
        onConfirm={handlePermanentDelete}
      />
    </div>
  );
}
