import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import type { CourseListItem } from "@/types/course";

export type CourseAdminListColumnLabels = {
  course: string;
  owner: string;
  version: string;
  status: string;
};

type BuildCourseAdminListColumnsOptions = {
  /** When true, render "—" if review_status is empty (all/trash lists). */
  showStatusDashWhenEmpty?: boolean;
};

export function buildCourseAdminListColumns(
  labels: CourseAdminListColumnLabels,
  options?: BuildCourseAdminListColumnsOptions,
): DataTableColumn<CourseListItem>[] {
  const showStatusDashWhenEmpty = options?.showStatusDashWhenEmpty ?? true;

  return [
    {
      id: "title",
      header: labels.course,
      cell: (row) => (
        <div className="space-y-1">
          <div className="font-medium">{row.title || row.slug}</div>
          <div className="text-xs text-muted-foreground">/{row.slug}</div>
        </div>
      ),
    },
    {
      id: "owner",
      header: labels.owner,
      cell: (row) => row.owner_user_id,
    },
    {
      id: "version",
      header: labels.version,
      cell: (row) => row.version_no || "—",
    },
    {
      id: "status",
      header: labels.status,
      cell: (row) => {
        if (!row.review_status) {
          return showStatusDashWhenEmpty ? "—" : null;
        }
        return <CourseStatusBadge status={row.review_status} />;
      },
    },
  ];
}
