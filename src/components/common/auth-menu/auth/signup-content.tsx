"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { handleAuthSubmit } from "@/actions/auth/auth-client";
import { Button, Spinner } from "@/components/ui";
import { useAuthStore } from "@/hooks";
import { cn } from "@/lib/utils";
import { translateApiErrorCode } from "@/lib/utils/api-error";
import { type SignupFormValues, signupSchema } from "@/schema/auth";
import { AuthSocialLogin } from "../auth-social-login";
import { AuthEmailPasswordFields, AuthFullNameField } from "./auth-form-fields";

export function SignupContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.codes");
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
      setServerError(translateApiErrorCode(tErrors, result.code));
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
        <AuthFullNameField
          register={register("fullName")}
          placeholder={t("fullName")}
          error={errors.fullName}
        />

        <AuthEmailPasswordFields
          registerEmail={register("email")}
          registerPassword={register("password")}
          emailPlaceholder={t("email")}
          passwordPlaceholder={t("password")}
          emailError={errors.email}
          passwordError={errors.password}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword((prev) => !prev)}
          passwordHint={
            <p className="text-xs text-black/50 px-1">
              {t("passwordRules.hint")}
            </p>
          }
        />

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
          {isSubmitting ? <Spinner className="size-4" /> : t("register")}
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
