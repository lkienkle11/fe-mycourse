"use client";

import { useGetMe } from "@/hooks";
import { LoginSignupPopup } from "./auth/login-signup-popup";
import { AuthButton } from "./auth-button";
import { UserMenu } from "./user-menu";

export const AuthLayout = () => {
  const { me, isLoading } = useGetMe();

  return (
    <>
      {isLoading ? (
        <div className="size-10 animate-pulse rounded-full bg-object-black/10" />
      ) : me ? (
        <UserMenu me={me} />
      ) : (
        <AuthButton />
      )}
      <LoginSignupPopup />
    </>
  );
};
