"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LockKeyholeOpen, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthContext } from "@/hooks";
import { cn } from "@/lib/utils";
import { signupSchema, type SignupFormValues } from "@/schema/auth";
import { AuthSocialLogin } from "../auth-social-login";
import { handleAuthSubmit } from "./auth-form-handler";

export function SignupContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const { openLoginModal, closeAllModals } = useAuthContext();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    const result = await handleAuthSubmit("signup", values);
    if (result.success) {
      closeAllModals();
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <AuthSocialLogin type="signup" />
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("socialLogin.title")}
      </span>

      <form onSubmit={handleSubmit(onSubmit)} className="contents space-y-3">
        <div className="space-y-1">
          <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
            <InputGroupInput
              className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
              type="text"
              placeholder={t("fullName")}
              {...register("fullName")}
            />
            <InputGroupAddon align="inline-end" className="mr-2">
              <User />
            </InputGroupAddon>
          </InputGroup>
          {errors.fullName ? (
            <p className="text-xs text-destructive px-1">
              {t(errors.fullName.message as "validation.fullName")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
            <InputGroupInput
              className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
              type="email"
              placeholder={t("email")}
              {...register("email")}
            />
            <InputGroupAddon align="inline-end" className="mr-2">
              <Mail />
            </InputGroupAddon>
          </InputGroup>
          {errors.email ? (
            <p className="text-xs text-destructive px-1">
              {t(errors.email.message as "validation.email")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <InputGroup className="h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0">
            <InputGroupInput
              className="placeholder:text-object-black/10 placeholder:text-base text-base px-4"
              type={showPassword ? "text" : "password"}
              placeholder={t("password")}
              {...register("password")}
            />
            <InputGroupAddon
              align="inline-end"
              className="mr-2 hover:cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <LockKeyholeOpen /> : <LockKeyhole />}
            </InputGroupAddon>
          </InputGroup>
          {errors.password ? (
            <p className="text-xs text-destructive px-1">
              {t(errors.password.message as "validation.password")}
            </p>
          ) : null}
        </div>

        {serverError ? (
          <p className="text-xs text-destructive text-center px-1">
            {serverError}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-sm font-medium flex items-center justify-center bg-base-primary rounded-full leading-[21px] hover:cursor-pointer hover:brightness-110 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "..." : t("register")}
        </Button>
      </form>

      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black mt-2">
        {t("alreadyHaveAccount")}
        <Button
          type="button"
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
