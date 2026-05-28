"use client";

import { X } from "lucide-react";
import { useMemo } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
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
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-300 bg-black/50 backdrop-blur-sm"
        className={cn(
          "inset-0 top-0 left-0 z-301 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 items-center justify-center bg-transparent p-4 shadow-none ring-0 sm:max-w-none",
          contentClassName,
        )}
      >
        <div
          className={cn(
            "scrollbar-app relative w-full max-w-200 overflow-y-auto rounded-xl bg-popover ring-1 ring-foreground/10",
            "max-h-[min(100dvh-2rem,56rem)]",
          )}
        >
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 right-2 z-10 bg-background/90 hover:bg-background"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </Button>
          </DialogClose>
          <LoginSignupLayout type={authAction as "login" | "signup"}>
            {authAction === "login" ? <LoginContent /> : <SignupContent />}
          </LoginSignupLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}
