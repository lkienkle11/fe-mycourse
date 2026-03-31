export type UserMenuStatus = "warning" | "normal";

export type UserMenuItem = {
  href: string;
  title: string;
  status: UserMenuStatus;
  itemClassName?: string;
};

export type UserMenuGroup = {
  key: string;
  value: UserMenuItem[];
};

export const HEADER_DROPDOWN_ITEMS: UserMenuGroup[] = [
  {
    key: "study",
    value: [
      { href: "/my-courses", title: "My Courses", status: "normal" },
      { href: "/my-cart", title: "My Cart", status: "normal" },
      { href: "/wishlist", title: "Wishlist", status: "normal" },
    ],
  },
  {
    key: "account",
    value: [
      { href: "/notifications", title: "Notifications", status: "normal" },
      {
        href: "/account-settings",
        title: "Account Settings",
        status: "normal",
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
