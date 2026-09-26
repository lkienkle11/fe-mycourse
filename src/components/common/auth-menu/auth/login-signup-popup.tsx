"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { homeHref } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { LoginContent } from "./login-content";
import { LoginSignupLayout } from "./login-signup-layout";
import { SignupContent } from "./signup-content";

/** Matches `DialogContent`/`DialogOverlay`'s `duration-100` exit animation. */
const CLOSE_ANIMATION_MS = 100;

export function LoginSignupPopup({
  type,
  contentClassName,
}: {
  type: "login" | "signup";
  contentClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  /** Lets the Radix exit animation play before the route change unmounts it. */
  function closeWithAnimation(after: () => void) {
    setOpen(false);
    window.setTimeout(after, CLOSE_ANIMATION_MS);
  }

  function handleOpenChange(next: boolean) {
    if (next) return;
    closeWithAnimation(() => router.back());
  }

  function handleAuthenticated(destination: string) {
    closeWithAnimation(() => router.push(destination || homeHref));
  }

  const title = type === "signup" ? "Sign up" : "Sign in";
  const description =
    type === "signup"
      ? "Create a MyCourse account"
      : "Sign in to your MyCourse account";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-300 bg-black/50 backdrop-blur-sm"
        className={cn(
          "inset-0 top-0 left-0 z-301 flex h-dvh w-full max-w-none translate-x-0 translate-y-0 items-center justify-center bg-transparent p-4 shadow-none ring-0 sm:max-w-none",
          contentClassName,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
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
          <LoginSignupLayout type={type}>
            {type === "login" ? (
              <LoginContent onAuthenticated={handleAuthenticated} />
            ) : (
              <SignupContent onAuthenticated={handleAuthenticated} />
            )}
          </LoginSignupLayout>
        </div>
      </DialogContent>
    </Dialog>
  );
}
