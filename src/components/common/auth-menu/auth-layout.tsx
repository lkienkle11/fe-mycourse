"use client";

import { useGetMe } from "@/hooks";
import { AuthButton } from "./auth-button";
import { UserMenu } from "./user-menu";

/** Header auth chrome only — the login/signup modal is rendered by the `@modal` parallel-route slot when `/login`/`/signup` is the active intercepted route (see `login-signup-popup.tsx`). */
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
