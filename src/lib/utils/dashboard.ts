import { filterPermissionNavTree } from "@/lib/utils/permission";
import type { DashboardItem } from "@/types/dashboard";

/** Deep-filter dashboard nav via `filterPermissionNavTree` (bottom-up, all depths). */
export function filterDashboardItems(
  set: ReadonlySet<string>,
  items: readonly DashboardItem[],
): DashboardItem[] {
  return filterPermissionNavTree(set, items);
}
