import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  Brain,
  Layers,
  Network,
  Tags,
  Target,
} from "lucide-react";

/** Sidebar icons for taxonomy group + each resource (admin & sysadmin dashboards). */
export const TAXONOMY_MENU_ICONS = {
  group: Network,
  levels: Layers,
  topics: BookMarked,
  outcomes: Target,
  skills: Brain,
  tags: Tags,
} as const satisfies Record<string, LucideIcon>;
