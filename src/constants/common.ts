import { PERMISSIONS } from "@/constants/permissions";
import type { UserMenuGroup } from "@/types/user-menu";

export const HEADER_DROPDOWN_ITEMS: UserMenuGroup[] = [
  {
    key: "study",
    value: [
      {
        href: "/my-courses",
        title: "My Courses",
        status: "normal",
        permissions: [PERMISSIONS.CourseRead],
      },
      {
        href: "/my-cart",
        title: "My Cart",
        status: "normal",
        permissions: [PERMISSIONS.ProfileRead],
      },
      {
        href: "/wishlist",
        title: "Wishlist",
        status: "normal",
        permissions: [PERMISSIONS.ProfileRead],
      },
    ],
  },
  {
    key: "account",
    value: [
      {
        href: "/notifications",
        title: "Notifications",
        status: "normal",
        permissions: [PERMISSIONS.ProfileRead],
      },
      {
        href: "/account-settings",
        title: "Account Settings",
        status: "normal",
        permissions: [PERMISSIONS.ProfileRead],
      },
    ],
  },
  {
    key: "session",
    value: [
      {
        href: "/logout",
        title: "Logout",
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
