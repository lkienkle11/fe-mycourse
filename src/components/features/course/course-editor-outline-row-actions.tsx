"use client";

import { MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CourseOutlineItemKind } from "@/types/course";

type OutlineRowActionId = "add" | "edit" | "delete";

type OutlineRowActionConfig = {
  id: OutlineRowActionId;
  labelKey:
    | "addLesson"
    | "editSection"
    | "deleteSection"
    | "addItem"
    | "editLesson"
    | "deleteLesson"
    | "editItem"
    | "deleteItem";
  variant?: "default" | "destructive";
};

const OUTLINE_ROW_ACTIONS: Record<
  CourseOutlineItemKind,
  OutlineRowActionConfig[]
> = {
  section: [
    { id: "add", labelKey: "addLesson" },
    { id: "edit", labelKey: "editSection" },
    { id: "delete", labelKey: "deleteSection", variant: "destructive" },
  ],
  lesson: [
    { id: "add", labelKey: "addItem" },
    { id: "edit", labelKey: "editLesson" },
    { id: "delete", labelKey: "deleteLesson", variant: "destructive" },
  ],
  item: [
    { id: "edit", labelKey: "editItem" },
    { id: "delete", labelKey: "deleteItem", variant: "destructive" },
  ],
};

type CourseOutlineRowActionsProps = {
  kind: CourseOutlineItemKind;
  onAdd?: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CourseOutlineRowActions({
  kind,
  onAdd,
  onEdit,
  onDelete,
}: CourseOutlineRowActionsProps) {
  const tCommon = useTranslations("course.common");
  const t = useTranslations("course.editor.outline");

  const handlers: Record<OutlineRowActionId, (() => void) | undefined> = {
    add: onAdd,
    edit: onEdit,
    delete: onDelete,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <span>{tCommon("actions")}</span>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OUTLINE_ROW_ACTIONS[kind].map((action) => {
          const onClick = handlers[action.id];
          if (!onClick) {
            return null;
          }

          return (
            <DropdownMenuItem
              key={action.id}
              variant={action.variant}
              onClick={onClick}
            >
              {t(action.labelKey)}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
