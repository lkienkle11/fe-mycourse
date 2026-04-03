"use client";

import { LockKeyhole, LockKeyholeOpen, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthContext } from "@/context";
import { cn } from "@/lib/utils";
import { AuthSocialLogin } from "../auth-social-login";

export function SignupContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const { openLoginModal } = useAuthContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className={cn("space-y-3", className)}>
      <AuthSocialLogin type="signup" />
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("socialLogin.title")}
      </span>
      <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupInput
          className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
          id="fullName"
          type="text"
          placeholder={t("fullName")}
        />
        <InputGroupAddon align="inline-end" className="mr-2">
          <User />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupInput
          className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
          id="email"
          type="email"
          placeholder={t("email")}
        />
        <InputGroupAddon align="inline-end" className="mr-2">
          <Mail />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
        <InputGroupInput
          className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder={t("password")}
        />
        <InputGroupAddon
          align="inline-end"
          className="mr-2 hover:cursor-pointer"
          onClick={() => setShowPassword((prev) => !prev)}
        >
          {showPassword ? <LockKeyholeOpen /> : <LockKeyhole />}
        </InputGroupAddon>
      </InputGroup>
      <Button className="w-full h-11 text-sm font-medium flex items-center justify-center bg-base-primary rounded-full leading-[21px] hover:cursor-pointer hover:brightness-110 transition-all duration-300">
        {t("register")}
      </Button>
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("alreadyHaveAccount")}
        <Button
          variant="ghost"
          onClick={() => openLoginModal()}
          className="hover:no-underline hover:cursor-pointer hover:text-[#3DCBB1] no-underline text-[#3DCBB1] hover:brightness-110 transition-all duration-300 pl-0.5"
        >
          {t("login")}
        </Button>
      </span>
    </div>
  );
}
