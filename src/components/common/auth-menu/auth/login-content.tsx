"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LockKeyholeOpen, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { useAuthContext, useGetMe } from "@/hooks";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { type LoginFormValues, loginSchema } from "@/schema/auth";
import { AuthSocialLogin } from "../auth-social-login";
import { handleAuthSubmit } from "./auth-form-handler";

export function LoginContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const { openSignupModal, closeAllModals, nextLink } = useAuthContext();
  const { mutateMe } = useGetMe();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    const result = await handleAuthSubmit("login", values);
    if (result.success) {
      mutateMe();
      closeAllModals();
      if (nextLink) {
        router.push(nextLink);
      }
    } else {
      setServerError(result.message);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="contents space-y-3">
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

        <div className="flex justify-between items-center">
          <Field
            orientation="horizontal"
            className="flex items-center gap-2 justify-start"
          >
            <Checkbox
              id="remember-me"
              name="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) =>
                setValue("rememberMe", checked === true)
              }
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
          {isSubmitting ? "..." : t("login")}
        </Button>
      </form>

      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black mt-2">
        {t("socialLogin.title")}
      </span>
      <AuthSocialLogin type="login" />
      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black">
        {t("noAccount")}
        <Button
          type="button"
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
