"use client";

import { LockKeyhole, LockKeyholeOpen, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context";
import { cn } from "@/lib/utils";
import { AuthSocialLogin } from "../auth-social-login";

export function LoginContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const { openSignupModal } = useAuthContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  return (
    <div className={cn("space-y-3", className)}>
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
      <div className="flex justify-between items-center">
        <Field
          orientation="horizontal"
          className="flex items-center gap-2 justify-start"
        >
          <Checkbox
            id="remember-me"
            name="remember-me"
            className="size-4 hover:cursor-pointer"
          />
          <Label
            htmlFor="remember-me"
            className="hover:no-underline hover:cursor-pointer no-underline hover:brightness-110 transition-all duration-300"
          >
            {t("rememberMe")}
          </Label>
        </Field>
        <Field
          orientation="horizontal"
          className="justify-end items-center text-end"
        >
          <Link
            href="/forgot-password"
            className="hover:no-underline hover:cursor-pointer no-underlin"
          >
            <Label className="hover:no-underline hover:cursor-pointer no-underline text-[#3DCBB1] hover:brightness-110 transition-all duration-300">
              {t("forgotPassword")}
            </Label>
          </Link>
        </Field>
      </div>
      <Button className="w-full h-11 text-sm font-medium flex items-center justify-center bg-base-primary rounded-full leading-[21px] hover:cursor-pointer hover:brightness-110 transition-all duration-300">
        {t("login")}
      </Button>
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("socialLogin.title")}
      </span>
      <AuthSocialLogin type="login" />
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("noAccount")}
        <Button
          variant="ghost"
          onClick={() => openSignupModal()}
          className="hover:no-underline hover:cursor-pointer hover:text-[#3DCBB1] no-underline text-[#3DCBB1] hover:brightness-110 transition-all duration-300 pl-0.5"
        >
          {t("register")}
        </Button>
      </span>
    </div>
  );
}
