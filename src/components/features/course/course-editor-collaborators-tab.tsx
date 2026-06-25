"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useCourseCollaborators } from "@/api/hooks/course";
import { CourseCollaboratorPickerDialog } from "@/components/features/course/course-collaborator-picker-dialog";
import { buildInstructorPageFooterFromInfo } from "@/components/features/instructor/instructor-action-controls";
import { InstructorListPagination } from "@/components/features/instructor/instructor-list-pagination";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { PERMISSIONS } from "@/constants/permissions";
import { useRouter } from "@/i18n/navigation";
import { instructorCourseEditorTabHref } from "@/lib/navigation/routes";
import type { CourseCollaborator } from "@/types/course";

const PER_PAGE = 10;

type CourseCollaboratorsTabProps = {
  courseId: string;
  canManageCollaborators: boolean;
  isSubmittingCollaborator: boolean;
  onAddCollaborators: (userIds: string[]) => Promise<void>;
  onRemoveCollaborator: (collaborator: CourseCollaborator) => Promise<void>;
};

export function CourseCollaboratorsTab({
  courseId,
  canManageCollaborators,
  isSubmittingCollaborator,
  onAddCollaborators,
  onRemoveCollaborator,
}: CourseCollaboratorsTabProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.collaborators");
  const tc = useTranslations("instructor.common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const search = searchParams.get("search")?.trim() ?? "";

  const filters = useMemo(
    () => ({
      page,
      per_page: PER_PAGE,
      search,
    }),
    [page, search],
  );

  const { rows, pageInfo, isLoading, mutate } = useCourseCollaborators(
    courseId,
    filters,
  );

  const syncUrl = useCallback(
    (next: { page?: number; search?: string }) => {
      const query: Record<string, string> = {
        page: String(next.page ?? page),
      };
      const nextSearch = next.search ?? search;
      if (nextSearch) {
        query.search = nextSearch;
      }
      router.replace(
        instructorCourseEditorTabHref(courseId, "collaborators", query),
      );
    },
    [courseId, page, router, search],
  );

  const footerProps = buildInstructorPageFooterFromInfo(
    pageInfo,
    page,
    (nextPage) => syncUrl({ page: nextPage }),
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
    syncUrl({ page: 1, search: searchInput.trim() });
  };

  const handleAddCollaborators = async (userIds: string[]) => {
    await onAddCollaborators(userIds);
    await mutate();
  };

  const handleRemoveCollaborator = async (collaborator: CourseCollaborator) => {
    await onRemoveCollaborator(collaborator);
    const updated = await mutate();
    const totalPages =
      updated?.page_info.total_pages ?? pageInfo?.total_pages ?? 1;
    if (page > totalPages) {
      syncUrl({ page: totalPages });
    }
  };

  return (
    <TabsContent value="collaborators" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          {canManageCollaborators ? (
            <PermissionGate
              permissions={[PERMISSIONS.CourseCollaboratorCandidateRead]}
            >
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setPickerOpen(true)}
              >
                {t("addEditor")}
              </Button>
            </PermissionGate>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={searchInput}
              placeholder={t("listSearchPlaceholder")}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applySearch();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={applySearch}
            >
              {t("listSearchAction")}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("listLoading")}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("listEmpty")}</p>
          ) : (
            <div className="space-y-3">
              {rows.map((collaborator) => (
                <div
                  key={collaborator.user_id}
                  className="flex min-w-0 flex-col gap-3 rounded-md border p-3 xl:flex-row xl:items-center xl:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div
                      className="truncate font-medium"
                      title={collaborator.display_name}
                    >
                      {collaborator.display_name}
                    </div>
                    <div
                      className="break-all text-sm text-muted-foreground"
                      title={collaborator.email}
                    >
                      {collaborator.email}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Badge variant="outline">
                      {tCommon(`collaboratorRole.${collaborator.role}`)}
                    </Badge>
                    {canManageCollaborators && collaborator.role !== "OWNER" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          void handleRemoveCollaborator(collaborator)
                        }
                      >
                        {t("remove")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <InstructorListPagination {...footerProps} />
        </CardContent>
      </Card>

      {canManageCollaborators ? (
        <PermissionGate
          permissions={[PERMISSIONS.CourseCollaboratorCandidateRead]}
        >
          <CourseCollaboratorPickerDialog
            courseId={courseId}
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            isSubmitting={isSubmittingCollaborator}
            onConfirm={handleAddCollaborators}
          />
        </PermissionGate>
      ) : null}
    </TabsContent>
  );
}
