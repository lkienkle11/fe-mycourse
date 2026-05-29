"use client";

import { GitBranch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { DagreTreeDialog } from "@/components/shared/dagre-tree-dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildTaxonomyDagreRoot,
  countTaxonomyTreeNodes,
  getTaxonomyTreeFromEntity,
} from "@/lib/utils/taxonomy";
import type {
  CourseSkill,
  CourseTopic,
  TaxonomyResourceKey,
} from "@/types/taxonomy";

type TaxonomyTreeViewButtonProps = {
  resourceKey: Extract<TaxonomyResourceKey, "topics" | "skills">;
  row: CourseTopic | CourseSkill;
};

export function TaxonomyTreeViewButton({
  resourceKey,
  row,
}: TaxonomyTreeViewButtonProps) {
  const t = useTranslations("taxonomy");
  const tDagre = useTranslations("dagreTree");
  const [open, setOpen] = useState(false);

  const childCount = useMemo(
    () => countTaxonomyTreeNodes(getTaxonomyTreeFromEntity(resourceKey, row)),
    [resourceKey, row],
  );

  const dagreRoot = useMemo(
    () => buildTaxonomyDagreRoot(resourceKey, row),
    [resourceKey, row],
  );

  const buttonLabel =
    childCount > 0
      ? `${t("treeView.button")} (${childCount})`
      : t("treeView.button");

  const button = (
    <Button
      variant="outline"
      size="sm"
      disabled={childCount === 0}
      onClick={() => setOpen(true)}
      aria-label={buttonLabel}
    >
      <GitBranch className="size-4" />
      {buttonLabel}
    </Button>
  );

  return (
    <>
      {childCount === 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{button}</span>
            </TooltipTrigger>
            <TooltipContent>{tDagre("empty")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        button
      )}
      <DagreTreeDialog
        open={open}
        onOpenChange={setOpen}
        title={t("treeView.dialogTitle", { name: row.name })}
        root={dagreRoot}
        nodesDraggable={false}
        labels={{
          vertical: tDagre("layoutVertical"),
          horizontal: tDagre("layoutHorizontal"),
          empty: tDagre("empty"),
        }}
      />
    </>
  );
}
