"use client";

import { DiscordIcon, GoogleIcon } from "@public/assets/icons/social-icons";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AuthSocialLoginProps {
  type: "login" | "signup";
  className?: string;
  onGoogleClick?: () => void;
  googleLoading?: boolean;
  onDiscordClick?: () => void;
  discordLoading?: boolean;
}

export function AuthSocialLogin({
  type,
  className,
  onGoogleClick,
  googleLoading = false,
  onDiscordClick,
  discordLoading = false,
}: AuthSocialLoginProps) {
  const t = useTranslations("auth.socialLogin");

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <Button
        type="button"
        variant="ghost"
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full bg-[#5865F2] hover:bg-[#5865F2]/90 text-white hover:text-white text-sm font-medium hover:cursor-pointer disabled:opacity-60"
        onClick={onDiscordClick}
        disabled={discordLoading || !onDiscordClick}
      >
        <DiscordIcon width={18} height={18} />
        <span>{t(type === "login" ? "discordLogin" : "discordSignup")}</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-black hover:text-black text-sm font-medium hover:cursor-pointer disabled:opacity-60"
        onClick={onGoogleClick}
        disabled={googleLoading || !onGoogleClick}
      >
        <GoogleIcon width={18} height={18} />
        <span>{t(type === "login" ? "googleLogin" : "googleSignup")}</span>
      </Button>
    </div>
  );
}
