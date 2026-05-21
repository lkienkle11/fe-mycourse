import type { PermissionRequirement } from "./permissions";

export type UserMenuStatus = "warning" | "normal";

export type UserMenuItem = PermissionRequirement & {
  href: string;
  title: string;
  status: UserMenuStatus;
  itemClassName?: string;
};

export type UserMenuGroup = PermissionRequirement & {
  key: string;
  value: UserMenuItem[];
};
