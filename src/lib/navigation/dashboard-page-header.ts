import {
  DASHBOARD_PAGE_HEADER_ROUTES,
  DASHBOARD_ROLE_ROOT,
} from "@/constants/dashboard";
import type {
  DashboardHeaderRouteEntry,
  DashboardHeaderStaticMetadata,
  DashboardItem,
  DashboardPageHeaderBreadcrumbItem,
  DashboardRole,
} from "@/types/dashboard";

type TranslateDashboardLabel = (key: string) => string;

function isMatch(pathname: string, match: string | RegExp) {
  if (typeof match === "string") {
    return pathname === match;
  }

  return match.test(pathname);
}

function detectDashboardRole(pathname: string): DashboardRole | null {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/instructor")) {
    return "instructor";
  }

  if (pathname.startsWith("/sysadmin")) {
    return "sysadmin";
  }

  return null;
}

function findDashboardItemById(
  items: readonly DashboardItem[],
  itemId: string,
): DashboardItem | null {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }

    if (item.children?.length) {
      const found = findDashboardItemById(item.children, itemId);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

/** Walks the nav tree and returns the ancestor chain down to the item with `href`. */
function findDashboardItemPathByHref(
  items: readonly DashboardItem[],
  href: string,
  ancestors: DashboardItem[] = [],
): DashboardItem[] | null {
  for (const item of items) {
    const path = [...ancestors, item];

    if (item.href === href) {
      return path;
    }

    if (item.children?.length) {
      const found = findDashboardItemPathByHref(item.children, href, path);

      if (found) {
        return found;
      }
    }
  }

  return null;
}

function resolveItemLabel(
  item: DashboardItem,
  translate: TranslateDashboardLabel,
) {
  if (!item.titleKey) {
    return item.title;
  }

  return translate(`dashboard.${item.titleKey}`);
}

function resolveRoleRootBreadcrumb(
  role: DashboardRole,
  translate: TranslateDashboardLabel,
): DashboardPageHeaderBreadcrumbItem {
  const roleConfig = DASHBOARD_ROLE_ROOT[role];

  return {
    key: `${role}-root`,
    label: translate(roleConfig.titleKey),
    href: roleConfig.href,
  };
}

function resolveExplicitBreadcrumbs(
  refs: NonNullable<DashboardHeaderRouteEntry["breadcrumbs"]>,
  items: readonly DashboardItem[],
  translate: TranslateDashboardLabel,
): DashboardPageHeaderBreadcrumbItem[] {
  return refs.flatMap((breadcrumb) => {
    if (breadcrumb.kind === "role-root") {
      return [resolveRoleRootBreadcrumb(breadcrumb.role, translate)];
    }

    const item = findDashboardItemById(items, breadcrumb.itemId);

    if (!item) {
      return [];
    }

    return [
      {
        key: breadcrumb.itemId,
        label: resolveItemLabel(item, translate),
        href: breadcrumb.href ?? item.href,
      },
    ];
  });
}

function resolveBreadcrumbHref(
  entry: DashboardHeaderRouteEntry,
): string | undefined {
  if (entry.breadcrumbHref) {
    return entry.breadcrumbHref;
  }

  if (typeof entry.match === "string") {
    return entry.match;
  }

  return undefined;
}

function resolveBreadcrumbsFromNavTree(
  entry: DashboardHeaderRouteEntry,
  pathname: string,
  items: readonly DashboardItem[],
  translate: TranslateDashboardLabel,
): DashboardPageHeaderBreadcrumbItem[] {
  if (entry.breadcrumbs?.length) {
    return resolveExplicitBreadcrumbs(entry.breadcrumbs, items, translate);
  }

  const role = detectDashboardRole(pathname);

  if (!role) {
    return [];
  }

  const roleRoot = resolveRoleRootBreadcrumb(role, translate);
  const breadcrumbHref = resolveBreadcrumbHref(entry);

  if (!breadcrumbHref || breadcrumbHref === DASHBOARD_ROLE_ROOT[role].href) {
    return [roleRoot];
  }

  const itemPath = findDashboardItemPathByHref(items, breadcrumbHref);

  if (!itemPath?.length) {
    return [roleRoot];
  }

  const navCrumbs = itemPath.map((item) => ({
    key: item.id,
    label: resolveItemLabel(item, translate),
    href: item.href,
  }));

  return [roleRoot, ...navCrumbs];
}

export function resolveDashboardPageHeaderMetadata(
  pathname: string,
  items: readonly DashboardItem[],
  translate: TranslateDashboardLabel,
): DashboardHeaderStaticMetadata | null {
  const entry = DASHBOARD_PAGE_HEADER_ROUTES.find((candidate) =>
    isMatch(pathname, candidate.match),
  );

  if (!entry) {
    return null;
  }

  return {
    title: entry.titleKey ? translate(entry.titleKey) : undefined,
    description: entry.descriptionKey
      ? translate(entry.descriptionKey)
      : undefined,
    breadcrumbs: resolveBreadcrumbsFromNavTree(
      entry,
      pathname,
      items,
      translate,
    ),
  };
}
