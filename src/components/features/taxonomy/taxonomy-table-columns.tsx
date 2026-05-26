import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { DataTableColumn } from "@/components/shared/data-table";
import type { TaxonomyListColumn } from "@/constants/taxonomy/resources";
import type { TaxonomyEntity, TaxonomyResourceKey } from "@/types/taxonomy";
import {
  type CourseOutcome,
  type CourseSkill,
  type CourseTopic,
  countTaxonomyTreeNodes,
  type SlugStatusTaxonomy,
} from "@/types/taxonomy";

type TaxonomyTranslate = ReturnType<typeof useTranslations<"taxonomy">>;

function formatUnix(seconds: number): string {
  return new Date(seconds * 1000).toLocaleString();
}

function columnLabel(
  t: TaxonomyTranslate,
  resourceKey: TaxonomyResourceKey,
  columnId: TaxonomyListColumn["id"],
): string {
  switch (columnId) {
    case "name":
      return t("columns.name");
    case "slug":
      return t("columns.slug");
    case "short_description":
      return t("columns.shortDescription");
    case "status":
      return t("columns.status");
    case "child_count":
      return resourceKey === "skills"
        ? t("columns.childCountSkills")
        : t("columns.childCount");
    case "updated_at":
      return t("columns.updatedAt");
    default:
      return columnId;
  }
}

function renderCell(
  resourceKey: TaxonomyResourceKey,
  row: TaxonomyEntity,
  columnId: TaxonomyListColumn["id"],
  t: TaxonomyTranslate,
): ReactNode {
  if (resourceKey === "outcomes") {
    const outcome = row as CourseOutcome;
    switch (columnId) {
      case "short_description":
        return outcome.short_description;
      case "status":
        return outcome.status === "ACTIVE"
          ? t("common.statusActive")
          : t("common.statusInactive");
      case "updated_at":
        return formatUnix(outcome.updated_at);
      default:
        return "—";
    }
  }

  const slugRow = row as SlugStatusTaxonomy | CourseTopic | CourseSkill;
  switch (columnId) {
    case "name":
      return slugRow.name;
    case "slug":
      return slugRow.slug;
    case "status":
      return slugRow.status === "ACTIVE"
        ? t("common.statusActive")
        : t("common.statusInactive");
    case "child_count":
      if (resourceKey === "topics") {
        return countTaxonomyTreeNodes((row as CourseTopic).child_topics);
      }
      if (resourceKey === "skills") {
        return countTaxonomyTreeNodes((row as CourseSkill).children);
      }
      return 0;
    case "updated_at":
      return formatUnix(slugRow.updated_at);
    default:
      return "—";
  }
}

export function buildTaxonomyTableColumns(
  resourceKey: TaxonomyResourceKey,
  listColumns: TaxonomyListColumn[],
  t: TaxonomyTranslate,
): DataTableColumn<TaxonomyEntity>[] {
  return listColumns.map((column) => ({
    id: column.id,
    header: columnLabel(t, resourceKey, column.id),
    sortKey: column.sortKey,
    cell: (row) => renderCell(resourceKey, row, column.id, t),
  }));
}
