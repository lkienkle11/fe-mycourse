import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { PermissionRequirement } from "@/types/permissions";

/** Sidebar / menu item styling overrides passed into `DashboardLayout`. */
export type DashboardCustomStyles = {
  className?: string;
  itemClassName?: string;
  itemActiveClassName?: string;
};

/**
 * Recursive dashboard nav item — mirrors browse/user menu tree shape with RBAC.
 * `href` optional on group parents; leaves should include `href` for navigation.
 */
export type DashboardItem = PermissionRequirement & {
  id: string;
  /** Fallback label when `titleKey` is missing or translation is unavailable. */
  title: string;
  /** i18n key under the `dashboard` namespace (e.g. `taxonomy.menu.levels`). */
  titleKey?: string;
  href?: string;
  icon: LucideIcon;
  children?: DashboardItem[];
  disabled?: boolean;
  badge?: string | number;
};

export type DashboardLayoutProps = {
  children: React.ReactNode;
  /** Full menu tree; filtered client-side by `useFilteredDashboardItems`. */
  items: DashboardItem[];
  /** While `/me` is loading — show shell skeleton instead of unauthorized. */
  isLoading?: boolean;
  /**
   * Layout-level access override. When omitted, `permissions` on props are
   * checked via `useSatisfiesPermissions` (dashboard entry gate).
   */
  isAuthorized?: boolean;
  /** Required permissions to access the dashboard shell (not per-item). */
  permissions?: PermissionRequirement["permissions"];
  permissionMode?: PermissionRequirement["permissionMode"];
  /** Generic item activation (e.g. analytics). */
  onItemClick?: (item: DashboardItem) => void;
  /** Fired when navigating via a link item. */
  onNavigate?: (item: DashboardItem) => void;
  customStyles?: DashboardCustomStyles;
  onToggle?: (item: DashboardItem) => void;
  onExpand?: (item: DashboardItem) => void;
  onCollapse?: (item: DashboardItem) => void;
  onBlur?: (item: DashboardItem) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
};

export type DashboardRole = "admin" | "instructor" | "sysadmin";

export type DashboardPageHeaderBreadcrumbItem = {
  key?: string;
  label: ReactNode;
  href?: string;
};

export type DashboardPageHeaderProps = {
  breadcrumbs?: DashboardPageHeaderBreadcrumbItem[];
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export type DashboardPageHeaderOverride = Partial<DashboardPageHeaderProps>;

export type DashboardBreadcrumbRef =
  | {
      kind: "role-root";
      role: DashboardRole;
    }
  | {
      kind: "item";
      itemId: string;
      href?: string;
    };

export type DashboardHeaderRouteEntry = {
  match: string | RegExp;
  titleKey?: string;
  descriptionKey?: string;
  /**
   * Optional explicit breadcrumb refs for routes that cannot be derived from
   * the nav tree alone. Most routes rely on auto-derivation via `match` href.
   */
  breadcrumbs?: DashboardBreadcrumbRef[];
  /**
   * When `match` is a RegExp, use this href to locate the nav ancestry in the
   * role sidebar tree (`*DASHBOARD_ITEMS`).
   */
  breadcrumbHref?: string;
};

export type DashboardHeaderStaticMetadata = {
  title?: string;
  description?: string;
  breadcrumbs: DashboardPageHeaderBreadcrumbItem[];
};

export type DashboardRoleRoot = {
  href: string;
  titleKey: string;
  descriptionKey: string;
};
