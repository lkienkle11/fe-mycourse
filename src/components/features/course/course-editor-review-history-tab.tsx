"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { useCourseReviewHistory } from "@/api/hooks/course";
import { InstructorListPagination } from "@/components/features/instructor/instructor-list-pagination";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "@/i18n/navigation";
import { instructorCourseEditorTabHref } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import type {
  CourseReviewHistoryFilters,
  CourseReviewHistoryStatus,
} from "@/types/course";

const PER_PAGE = 10;

type CourseEditorReviewHistoryTabProps = {
  courseId: string;
};

function parseStatus(
  value: string | null,
): CourseReviewHistoryFilters["status"] {
  if (value === "APPROVED" || value === "REJECTED") {
    return value;
  }
  return "";
}

export function CourseEditorReviewHistoryTab({
  courseId,
}: CourseEditorReviewHistoryTabProps) {
  const t = useTranslations("course.editor.reviewHistory");
  const tc = useTranslations("instructor.common");
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const status = parseStatus(searchParams.get("status"));

  const filters = useMemo<CourseReviewHistoryFilters>(
    () => ({
      page,
      per_page: PER_PAGE,
      status,
    }),
    [page, status],
  );

  const { rows, pageInfo, isLoading } = useCourseReviewHistory(
    courseId,
    filters,
  );

  const totalPages = pageInfo?.total_pages ?? 1;

  const syncUrl = useCallback(
    (next: { page?: number; status?: CourseReviewHistoryStatus | "" }) => {
      const query: Record<string, string> = {
        page: String(next.page ?? page),
      };
      const nextStatus = next.status ?? status;
      if (nextStatus) {
        query.status = nextStatus;
      }
      router.replace(
        instructorCourseEditorTabHref(courseId, "review-history", query),
      );
    },
    [courseId, page, router, status],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Select
          value={status || "ALL"}
          onValueChange={(value) => {
            syncUrl({
              page: 1,
              status:
                value === "ALL" ? "" : (value as CourseReviewHistoryStatus),
            });
          }}
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder={t("filterAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("filterAll")}</SelectItem>
            <SelectItem value="APPROVED">{t("filterApproved")}</SelectItem>
            <SelectItem value="REJECTED">{t("filterRejected")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((item) => {
            const isApproved = item.status === "APPROVED";
            return (
              <li
                key={`${item.version_no}-${item.reviewed_at}`}
                className={cn(
                  "rounded-lg border p-4",
                  isApproved
                    ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30"
                    : "border-destructive/30 bg-destructive/5",
                )}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant={isApproved ? "default" : "destructive"}
                    className={
                      isApproved ? "bg-emerald-600 hover:bg-emerald-600" : ""
                    }
                  >
                    {isApproved ? t("statusApproved") : t("statusRejected")}
                  </Badge>
                  <Badge variant="outline">
                    {t("versionBadge", { version: String(item.version_no) })}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {item.note.trim() || t("emptyNote")}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <InstructorListPagination
        page={page}
        totalPages={totalPages}
        previousLabel={tc("previous")}
        nextLabel={tc("next")}
        pageOfLabel={tc("pageOf", {
          page: String(page),
          totalPages: String(totalPages),
        })}
        onPageChange={(nextPage) => syncUrl({ page: nextPage })}
      />
    </div>
  );
}
