"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { trashCourseService } from "@/api/callers/course";
import { useAdminCourses } from "@/api/hooks/course";
import { buildCourseAdminListColumns } from "@/components/features/course/course-admin-list-columns";
import { CourseAdminTableActionsMenu } from "@/components/features/course/course-admin-table-actions-menu";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toastApiError } from "@/lib/utils/api-error";
import { canMoveCourseToTrash } from "@/lib/utils/course";
import type { CourseListItem } from "@/types/course";

export function CourseAdminAllPage() {
  const t = useTranslations("course.adminAll");
  const tErrors = useTranslations("errors.codes");
  const { rows, isLoading, mutate } = useAdminCourses();
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [trashTarget, setTrashTarget] = useState<CourseListItem | null>(null);

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () =>
      buildCourseAdminListColumns({
        course: t("columns.course"),
        owner: t("columns.owner"),
        version: t("columns.version"),
      }),
    [t],
  );

  const handleMoveToTrash = async () => {
    if (!trashTarget) {
      return;
    }
    setPendingActionId(trashTarget.id);
    try {
      await trashCourseService(trashTarget.id);
      toast.success(t("toast.movedToTrash"));
      setTrashTarget(null);
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
          renderActions={(row) => {
            if (!canMoveCourseToTrash(row)) {
              return null;
            }
            return (
              <CourseAdminTableActionsMenu
                menuLabel={t("actions.menu")}
                disabled={pendingActionId === row.id}
              >
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setTrashTarget(row)}
                >
                  {t("actions.moveToTrash")}
                </DropdownMenuItem>
              </CourseAdminTableActionsMenu>
            );
          }}
        />
      )}

      <ConfirmDeleteDialog
        open={Boolean(trashTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setTrashTarget(null);
          }
        }}
        isLoading={pendingActionId != null}
        title={t("confirmTrash.title")}
        description={t("confirmTrash.description", {
          title: trashTarget?.title ?? "",
        })}
        onConfirm={handleMoveToTrash}
      />
    </div>
  );
}
