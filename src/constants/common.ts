import { PERMISSIONS } from "@/constants/permissions";
import {
  accountMyCartHref,
  accountMyCoursesHref,
  accountNotificationsHref,
  accountSettingsHref,
  accountWishlistHref,
  adminRootHref,
  instructorRootHref,
  logoutHref,
  sysadminRootHref,
} from "@/lib/navigation/routes";
import type { UserMenuGroup } from "@/types/user-menu";

/**
 * Study + account menu groups — kept for later wiring.
 * Not spread into `HEADER_DROPDOWN_ITEMS` yet: those paths have no
 * `app/[locale]/…/page.tsx`, and Next.js `Link` would prefetch 404.
 * Uncomment the spread in `HEADER_DROPDOWN_ITEMS` when pages ship.
 */
export const HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING: UserMenuGroup[] = [
  {
    key: "study",
    value: [
      {
        href: accountMyCoursesHref,
        title: "My Courses",
        titleKey: "myCourses",
        status: "normal",
        // permissions: [PERMISSIONS.CourseRead],
      },
      {
        href: accountMyCartHref,
        title: "My Cart",
        titleKey: "myCart",
        status: "normal",
        // permissions: [PERMISSIONS.ProfileRead],
      },
      {
        href: accountWishlistHref,
        title: "Wishlist",
        titleKey: "wishlist",
        status: "normal",
        // permissions: [PERMISSIONS.ProfileRead],
      },
    ],
  },
  {
    key: "account",
    value: [
      {
        href: accountNotificationsHref,
        title: "Notifications",
        titleKey: "notifications",
        status: "normal",
        // permissions: [PERMISSIONS.ProfileRead],
      },
      {
        href: accountSettingsHref,
        title: "Account Settings",
        titleKey: "accountSettings",
        status: "normal",
        // permissions: [PERMISSIONS.ProfileRead],
      },
    ],
  },
];

/**
 * Header / sidebar account menu (active render).
 * Account study/settings groups: see `HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING`.
 */
export const HEADER_DROPDOWN_ITEMS: UserMenuGroup[] = [
  {
    key: "roles",
    value: [
      {
        href: sysadminRootHref,
        title: "Sysadmin",
        titleKey: "sysadmin",
        status: "normal",
        permissions: [PERMISSIONS.SysadminModify],
      },
      {
        href: adminRootHref,
        title: "Admin",
        titleKey: "admin",
        status: "normal",
        permissions: [PERMISSIONS.AdminModify],
      },
      {
        href: instructorRootHref,
        title: "Instructor",
        titleKey: "instructor",
        status: "normal",
        permissions: [PERMISSIONS.InstructorModify],
      },
    ],
  },
  // TODO(account-pages): restore render when pages exist — uncomment next line.
  // ...HEADER_DROPDOWN_ACCOUNT_GROUPS_PENDING,
  {
    key: "session",
    value: [
      {
        href: logoutHref,
        title: "Logout",
        titleKey: "logout",
        status: "warning",
        itemClassName: "hover:text-red-500",
      },
    ],
  },
];

export const LANGUAGE_OPTIONS = [
  { locale: "vi", label: "Tiếng Việt" },
  { locale: "en", label: "English" },
] as const;
