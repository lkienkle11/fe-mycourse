"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCourseService, deleteCourseService } from "@/api/callers/course";
import { useEditableCourses } from "@/api/hooks/course";
import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import { DataTable } from "@/components/shared/data-table";
import { RequiredLabel } from "@/components/shared/required-label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import {
  instructorCourseEditorHref,
  instructorCourseEditorTabHref,
} from "@/lib/navigation/routes";
import { slugifyName } from "@/lib/utils";
import { toastApiError } from "@/lib/utils/api-error";
import { toastValidationError } from "@/lib/utils/validation-message";
import { courseCreateSchema } from "@/schema/course";
import type { CourseListItem } from "@/types/course";

export function InstructorCoursesPage() {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.list");
  const tValidation = useTranslations("course.validation");
  const tErrors = useTranslations("errors.codes");
  const router = useRouter();
  const { rows, isLoading, mutate } = useEditableCourses();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const derivedSlug = slugifyName(title);
  const [deleteTarget, setDeleteTarget] = useState<CourseListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleCreate = async () => {
    const parsed = courseCreateSchema.safeParse({ title: title.trim() });
    if (!parsed.success) {
      toastValidationError(tValidation, parsed.error.issues, "title");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createCourseService({
        title: title.trim(),
      });
      toast.success(t("toast.created"));
      setCreateOpen(false);
      setTitle("");
      await mutate();
      router.push(instructorCourseEditorTabHref(created.course.id, "info"));
    } catch (error) {
      toastApiError(tErrors, error);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          {t("newCourse")}
        </Button>
      </div>

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
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-slug">{t("createDialog.slugLabel")}</Label>
              <Input
                id="course-slug"
                readOnly
                value={derivedSlug}
                className="cursor-not-allowed bg-muted"
                aria-readonly
              />
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
              disabled={isSubmitting || !title.trim() || derivedSlug.length < 1}
              onClick={() => void handleCreate()}
            >
              {isSubmitting
                ? t("createDialog.creating")
                : t("createDialog.create")}
            </Button>
          </DialogFooter>
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
