"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteCourseService } from "@/api/callers/course";
import { useEditableCourses } from "@/api/hooks/course";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { RequiredLabel } from "@/components/shared/required-label";
import { SlugInput } from "@/components/shared/slug-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCourseCreateFlow } from "@/hooks/course";
import { useRegisterDashboardPageHeader } from "@/hooks/dashboard";
import { useRouter } from "@/i18n/navigation";
import {
  instructorCourseEditorHref,
  instructorCourseEditorTabHref,
} from "@/lib/navigation/routes";
import { toastApiError } from "@/lib/utils/api-error";
import type { CourseListItem } from "@/types/course";

export function InstructorCoursesPage() {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.list");
  const tErrors = useTranslations("errors.codes");
  const router = useRouter();
  const { rows, isLoading, mutate } = useEditableCourses();
  const [createOpen, setCreateOpen] = useState(false);
  const create = useCourseCreateFlow({
    onCreated: async (created) => {
      setCreateOpen(false);
      await mutate();
      router.push(instructorCourseEditorTabHref(created.course.id, "info"));
    },
  });
  const [deleteTarget, setDeleteTarget] = useState<CourseListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const headerActions = useMemo(
    () => (
      <Button type="button" onClick={() => setCreateOpen(true)}>
        {t("newCourse")}
      </Button>
    ),
    [t],
  );
  const headerOverride = useMemo(
    () => ({
      actions: headerActions,
    }),
    [headerActions],
  );

  useRegisterDashboardPageHeader(headerOverride);

  const columns = useMemo<DataTableColumn<CourseListItem>[]>(
    () => [
      {
        id: "title",
        header: t("columns.course"),
        cell: (row) => (
          <div className="space-y-1">
            <div className="font-medium">{row.title || row.slug}</div>
            <div className="text-xs text-muted-foreground">/{row.slug}</div>
          </div>
        ),
      },
      {
        id: "role",
        header: t("columns.access"),
        cell: (row) => tCommon(`collaboratorRole.${row.collaborator_role}`),
      },
      {
        id: "version",
        header: t("columns.version"),
        cell: (row) => (
          <div className="space-y-1">
            <div>v{row.version_no || 1}</div>
            <CourseStatusBadge status={row.review_status} />
          </div>
        ),
      },
    ],
    [t, tCommon],
  );

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteCourseService(deleteTarget.id);
      toast.success(t("toast.deleted"));
      setDeleteTarget(null);
      await mutate();
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.length === 0 ? (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                {t("empty")}
              </p>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="space-y-3 rounded-md border p-4">
                  <div className="space-y-1">
                    <div className="font-medium">{row.title || row.slug}</div>
                    <div className="text-xs text-muted-foreground">
                      /{row.slug}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      {tCommon(`collaboratorRole.${row.collaborator_role}`)}
                    </span>
                    <span>v{row.version_no || 1}</span>
                    <CourseStatusBadge status={row.review_status} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        router.push(instructorCourseEditorHref(row.id))
                      }
                    >
                      {tCommon("open")}
                    </Button>
                    {row.collaborator_role === "OWNER" ? (
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        {tCommon("delete")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={columns}
              rows={rows}
              actionsHeader={tCommon("actions")}
              emptyMessage={t("empty")}
              renderActions={(row) => (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(instructorCourseEditorHref(row.id))
                    }
                  >
                    {tCommon("open")}
                  </Button>
                  {row.collaborator_role === "OWNER" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteTarget(row)}
                    >
                      {tCommon("delete")}
                    </Button>
                  ) : null}
                </div>
              )}
            />
          </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createDialog.title")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <RequiredLabel htmlFor="course-title">
                {t("createDialog.titleLabel")}
              </RequiredLabel>
              <Input
                id="course-title"
                value={create.title}
                onChange={(event) => create.setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="course-slug" required={false}>
                {t("createDialog.slugLabel")}
              </RequiredLabel>
              <SlugInput
                id="course-slug"
                value={create.slug}
                onValueChange={create.setSlug}
                placeholder={t("createDialog.slugPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("createDialog.slugHint")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              disabled={create.isSubmitting || !create.title.trim()}
              onClick={() => void create.submit()}
            >
              {create.isSubmitting
                ? t("createDialog.creating")
                : t("createDialog.create")}
            </Button>
          </DialogFooter>

          <ConfirmActionDialog
            stacked
            open={create.suggestedSlug !== null}
            onOpenChange={(open) => {
              if (!open) {
                create.dismissSuggestion();
              }
            }}
            onConfirm={create.acceptSuggestion}
            title={t("createDialog.slugConflictTitle")}
            description={t("createDialog.slugConflictDescription", {
              slug: create.suggestedSlug ?? "",
            })}
            confirmLabel={t("createDialog.slugConflictConfirm")}
            cancelLabel={t("createDialog.slugConflictCancel")}
            isLoading={create.isSubmitting}
            loadingLabel={t("createDialog.creating")}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteDialog.title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t("deleteDialog.description")}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
            >
              {isDeleting ? t("deleteDialog.deleting") : tCommon("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
