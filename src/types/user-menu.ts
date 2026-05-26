import type { PermissionRequirement } from "./permissions";

export type UserMenuStatus = "warning" | "normal";

export type UserMenuItem = PermissionRequirement & {
  href: string;
  title: string;
  status: UserMenuStatus;
  itemClassName?: string;
  /** Optional nested links; filtered recursively by `filterUserMenuItems`. */
  children?: UserMenuItem[];
};

export type UserMenuGroup = PermissionRequirement & {
  key: string;
  value: UserMenuItem[];
};
