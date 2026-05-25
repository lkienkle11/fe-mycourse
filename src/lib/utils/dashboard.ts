import { satisfiesPermissions } from "@/lib/utils/permission";
import type { DashboardItem } from "@/types/dashboard";

/**
 * Filter dashboard tree by user permissions (same rules as `filterUserMenuGroups`):
 * 1) `satisfiesPermissions` on each node
 * 2) recurse into children
 * 3) drop group-only parent when filtered children empty and no `href`
 * 4) keep leaf with `href` even when it has no children
 */
export function filterDashboardItems(
  set: ReadonlySet<string>,
  items: readonly DashboardItem[],
): DashboardItem[] {
  const result: DashboardItem[] = [];

  for (const item of items) {
    if (!satisfiesPermissions(set, item)) {
      continue;
    }

    const filteredChildren = item.children
      ? filterDashboardItems(set, item.children)
      : undefined;

    const children =
      filteredChildren && filteredChildren.length > 0
        ? filteredChildren
        : undefined;

    if (!item.href && !children) {
      continue;
    }

    result.push({
      ...item,
      children,
    });
  }

  return result;
}
