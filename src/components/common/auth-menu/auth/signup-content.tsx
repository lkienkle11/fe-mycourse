"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, LockKeyholeOpen, Mail, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { type SignupFormValues, signupSchema } from "@/schema/auth";
import { ApiErrorCode } from "@/types/api";
import { AuthSocialLogin } from "../auth-social-login";
import { handleAuthSubmit } from "./auth-form-handler";

function registerErrorKey(code: number): string {
  switch (code) {
    case ApiErrorCode.EmailAlreadyExists:
      return "errors.emailAlreadyExists";
    case ApiErrorCode.WeakPassword:
      return "errors.weakPassword";
    case ApiErrorCode.RegistrationAbandoned:
      return "errors.registrationAbandoned";
    case ApiErrorCode.RegistrationEmailRateLimited:
      return "errors.rateLimited";
    case ApiErrorCode.ConfirmationEmailSendFailed:
      return "errors.emailSendFailed";
    default:
      return "errors.generic";
  }
}

export function SignupContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const { openLoginModal } = useAuthStore();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(
    null,
  );

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

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) return;
    const id = window.setInterval(() => {
      setRetryAfterSeconds((s) => {
        if (s === null || s <= 1) {
          window.clearInterval(id);
          return null;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [retryAfterSeconds]);

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    setRetryAfterSeconds(null);
    const result = await handleAuthSubmit("signup", values, locale);
    if (result.success) {
      setPendingEmail(values.email);
      setRegistrationPending(true);
    } else {
      if (result.retryAfterSeconds) {
        setRetryAfterSeconds(result.retryAfterSeconds);
      }
      const key = registerErrorKey(result.code);
      setServerError(t(key as "errors.generic"));
    }
  };

  if (registrationPending) {
    return (
      <div className={cn("space-y-4 text-center px-2", className)}>
        <h3 className="text-lg font-semibold text-black">
          {t("registerSuccess.title")}
        </h3>
        <p className="text-sm text-black/80">
          {t("registerSuccess.description", { email: pendingEmail })}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => openLoginModal()}
          className="w-full h-11 rounded-full"
        >
          {t("registerSuccess.backToLogin")}
        </Button>
      </div>
    );
  }

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
              {t(errors.password.message as "validation.passwordWeak")}
            </p>
          ) : (
            <p className="text-xs text-black/50 px-1">
              {t("passwordRules.hint")}
            </p>
          )}
        </div>

        {serverError ? (
          <p className="text-xs text-destructive text-center px-1">
            {serverError}
            {retryAfterSeconds !== null && retryAfterSeconds > 0
              ? ` ${t("errors.retryIn", { seconds: String(retryAfterSeconds) })}`
              : null}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting || (retryAfterSeconds ?? 0) > 0}
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
