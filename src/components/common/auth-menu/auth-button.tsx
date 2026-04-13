"use client";

import { TimelapseIcon } from "@public/assets";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/hooks";
import { cn } from "@/lib/utils";

export const AuthButton = ({ className }: { className?: string }) => {
  const t = useTranslations("auth");
  const { openLoginModal, openSignupModal } = useAuthStore();

  return (
    <div className={cn("flex justify-center items-center gap-2", className)}>
      <Button
        variant="ghost"
        onClick={() => openLoginModal()}
        className="rounded-xl border-1 border-object-black/90 text-object-black/90 hover:cursor-pointer transition-all duration-300 px-4 py-2 text-xs leading-4"
      >
        {t("login")}
      </Button>
      <Button
        variant="ghost"
        onClick={() => openSignupModal()}
        className="rounded-xl bg-base-primary text-white text-xs px-4 py-2 leading-4 hover:cursor-pointer transition-all duration-300 border-none hover:bg-base-primary/90 hover:text-white"
      >
        <TimelapseIcon />
        {t("register")}
      </Button>
    </div>
  );
};
