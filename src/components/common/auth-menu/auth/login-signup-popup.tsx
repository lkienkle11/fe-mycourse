"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { useAuthStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { LoginContent } from "./login-content";
import { LoginSignupLayout } from "./login-signup-layout";
import { SignupContent } from "./signup-content";

export function LoginSignupPopup({
  contentClassName,
}: {
  contentClassName?: string;
}) {
  const { authAction, closeAllModals } = useAuthStore();

  const isOpen = useMemo(
    () => authAction === "login" || authAction === "signup",
    [authAction],
  );

  const handleClose = () => {
    closeAllModals();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTitle />
      <DialogContent className={cn("w-full max-w-200 p-0", contentClassName)}>
        <LoginSignupLayout type={authAction as "login" | "signup"}>
          {authAction === "login" ? <LoginContent /> : <SignupContent />}
        </LoginSignupLayout>
      </DialogContent>
    </Dialog>
  );
}
