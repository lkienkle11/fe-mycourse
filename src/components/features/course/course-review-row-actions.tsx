"use client";

import { useTranslations } from "next-intl";
import { CourseAdminTableActionsMenu } from "@/components/features/course/course-admin-table-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { sysadminCourseReviewPreviewHref } from "@/lib/navigation/routes";
import type { CourseListItem } from "@/types/course";

type CourseReviewRowActionsProps = {
  scope: "admin" | "sysadmin";
  course: CourseListItem;
  disabled?: boolean;
  onApprove: (course: CourseListItem) => void;
  onReject: (course: CourseListItem) => void;
};

export function CourseReviewRowActions({
  scope,
  course,
  disabled = false,
  onApprove,
  onReject,
}: CourseReviewRowActionsProps) {
  const t = useTranslations("course.review");

  return (
    <CourseAdminTableActionsMenu
      menuLabel={t("actions.menu")}
      disabled={disabled}
    >
      {scope === "sysadmin" ? (
        <DropdownMenuItem className="p-0">
          <Link
            href={sysadminCourseReviewPreviewHref(course.id)}
            className="block w-full px-2 py-1.5"
          >
            {t("previewButton")}
          </Link>
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onClick={() => onApprove(course)}>
        {t("approve")}
      </DropdownMenuItem>
      <DropdownMenuItem variant="destructive" onClick={() => onReject(course)}>
        {t("reject")}
      </DropdownMenuItem>
    </CourseAdminTableActionsMenu>
  );
}
