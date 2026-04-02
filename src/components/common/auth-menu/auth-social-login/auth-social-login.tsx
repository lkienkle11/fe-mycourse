"use client";

import { GoogleIcon, XIcon } from "@public/assets/icons/auth-icons";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSocialLoginProps {
  type: "login" | "signup";
  className?: string;
}

export function AuthSocialLogin({ type, className }: AuthSocialLoginProps) {
  const t = useTranslations("auth.socialLogin");

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <Button
        variant="ghost"
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full bg-black hover:bg-black/90 text-white hover:text-white text-sm font-medium hover:cursor-pointer"
      >
        <XIcon color="#ffffff" width={18} height={18} />
        <span>{t(type === "login" ? "xLogin" : "xSignup")}</span>
      </Button>

      <Button
        variant="outline"
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-black hover:text-black text-sm font-medium hover:cursor-pointer"
      >
        <GoogleIcon width={18} height={18} />
        <span>{t(type === "login" ? "googleLogin" : "googleSignup")}</span>
      </Button>
    </div>
  );
}
