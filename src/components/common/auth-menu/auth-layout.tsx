"use client";

import { useGetMe } from "@/hooks";
import { AuthButton } from "./auth-button";
import { UserMenu } from "./user-menu";

/** Header auth chrome only — `LoginSignupPopup` is mounted once in `header.tsx`. */
export const AuthLayout = () => {
  const { me, isLoading } = useGetMe();

  return isLoading ? (
    <div className="size-10 animate-pulse rounded-full bg-object-black/10" />
  ) : me ? (
    <UserMenu me={me} />
  ) : (
    <AuthButton />
  );
};
