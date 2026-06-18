import { CourseStatusBadge } from "@/components/features/course/course-status-badge";
import type { DataTableColumn } from "@/components/shared/data-table";
import type { CourseListItem } from "@/types/course";

export type CourseAdminListColumnLabels = {
  course: string;
  owner: string;
  version: string;
  status?: string;
};

type BuildCourseAdminListColumnsOptions = {
  /** When true, include review status column (review queue only). */
  includeStatus?: boolean;
};

export function buildCourseAdminListColumns(
  labels: CourseAdminListColumnLabels,
  options?: BuildCourseAdminListColumnsOptions,
): DataTableColumn<CourseListItem>[] {
  const columns: DataTableColumn<CourseListItem>[] = [
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
  ];

  if (options?.includeStatus && labels.status) {
    columns.push({
      id: "status",
      header: labels.status,
      cell: (row) => {
        if (!row.review_status) {
          return "—";
        }
        return <CourseStatusBadge status={row.review_status} />;
      },
    });
  }

  return columns;
}
