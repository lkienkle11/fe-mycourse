"use client";

import type { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { DataTableColumn } from "@/components/shared/data-table";
import type {
  CourseOutcome,
  CourseSkill,
  CourseTopic,
  SlugStatusTaxonomy,
  TaxonomyEntity,
  TaxonomyListColumn,
  TaxonomyResourceKey,
} from "@/types/taxonomy";
import { TaxonomyTreeViewButton } from "./taxonomy-tree-view-button";

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
    case "child_render":
      return resourceKey === "skills"
        ? t("columns.childRenderSkills")
        : t("columns.childRender");
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
    case "child_render":
      if (resourceKey === "topics") {
        return (
          <TaxonomyTreeViewButton
            resourceKey="topics"
            row={row as CourseTopic}
          />
        );
      }
      if (resourceKey === "skills") {
        return (
          <TaxonomyTreeViewButton
            resourceKey="skills"
            row={row as CourseSkill}
          />
        );
      }
      return "—";
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
