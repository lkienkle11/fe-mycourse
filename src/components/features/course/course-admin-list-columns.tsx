import type { DataTableColumn } from "@/components/shared/data-table";
import type { CourseListItem } from "@/types/course";

export type CourseAdminListColumnLabels = {
  course: string;
  owner: string;
  version: string;
};

export function buildCourseAdminListColumns(
  labels: CourseAdminListColumnLabels,
): DataTableColumn<CourseListItem>[] {
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
      cell: (row) => row.owner_display_name?.trim() || row.owner_user_id,
    },
    {
      id: "version",
      header: labels.version,
      cell: (row) => row.version_no || "—",
    },
  ];
}
