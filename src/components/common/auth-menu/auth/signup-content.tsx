"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { handleAuthSubmit } from "@/actions/auth/auth-client";
import { Button, Spinner } from "@/components/ui";
import { useAuthNextParam } from "@/hooks/auth/use-auth-next-param";
import { useDiscordLogin } from "@/hooks/auth/use-discord-login";
import { useGoogleLogin } from "@/hooks/auth/use-google-login";
import { useOAuthPostAuth } from "@/hooks/auth/use-oauth-post-auth";
import { useRedirectIfAuthenticated } from "@/hooks/auth/use-redirect-if-authenticated";
import { getPathname, Link } from "@/i18n/navigation";
import { loginHref } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { translateApiErrorCode } from "@/lib/utils/api-error";
import { type SignupFormValues, signupSchema } from "@/schema/auth";
import { AuthSocialLogin } from "../auth-social-login";
import { AuthEmailPasswordFields, AuthFullNameField } from "./auth-form-fields";

export type SignupContentProps = {
  className?: string;
  /** Called after a successful OAuth signup, with the validated post-signup destination. */
  onAuthenticated: (destination: string) => void;
  /**
   * `"modal"` (default): the login/signup cross-link soft-navigates, which
   * Next.js intercepts as the login modal — the expected in-app experience.
   * `"page"`: rendered as the full-page fallback (`SignupPageContent`); the
   * cross-link forces a hard navigation to the plain login page instead,
   * since a soft nav here would still get intercepted as a modal stacked on
   * top of the very page it targets.
   */
  variant?: "modal" | "page";
};

export function SignupContent({
  className,
  onAuthenticated,
  variant = "modal",
}: SignupContentProps) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.codes");
  const locale = useLocale();
  const { nextPath } = useAuthNextParam();
  const isAuthenticated = useRedirectIfAuthenticated(nextPath);
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

  const handleOAuthSuccess = useOAuthPostAuth(nextPath, onAuthenticated);

  const { startGoogleLogin, isPending: googleLoading } = useGoogleLogin({
    rememberMe: false,
    onSuccess: () => {
      toast.success(t("socialLogin.googleSuccess"));
      handleOAuthSuccess();
    },
    onCancel: () => toast.message(t("socialLogin.googleCancelled")),
    onError: (result) =>
      setServerError(translateApiErrorCode(tErrors, result.code)),
  });

  const { startDiscordLogin, isPending: discordLoading } = useDiscordLogin({
    entrypoint: "signup",
    rememberMe: false,
    onSuccess: () => {
      toast.success(t("socialLogin.discordSuccess"));
      handleOAuthSuccess();
    },
    onCancel: () => toast.message(t("socialLogin.discordCancelled")),
    onError: (result) =>
      setServerError(translateApiErrorCode(tErrors, result.code)),
  });

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

  if (isAuthenticated) return null;

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
          asChild
          type="button"
          variant="outline"
          className="w-full h-11 rounded-full"
        >
          {variant === "page" ? (
            <a href={getPathname({ href: loginHref(nextPath), locale })}>
              {t("registerSuccess.backToLogin")}
            </a>
          ) : (
            <Link replace href={loginHref(nextPath)}>
              {t("registerSuccess.backToLogin")}
            </Link>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <AuthSocialLogin
        type="signup"
        onGoogleClick={() => startGoogleLogin()}
        googleLoading={googleLoading}
        onDiscordClick={() => void startDiscordLogin()}
        discordLoading={discordLoading}
      />
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
          asChild
          type="button"
          variant="ghost"
          className="hover:no-underline hover:cursor-pointer hover:text-[#3DCBB1] no-underline text-[#3DCBB1] hover:brightness-110 transition-all duration-300 pl-0.5"
        >
          {variant === "page" ? (
            <a href={getPathname({ href: loginHref(nextPath), locale })}>
              {t("login")}
            </a>
          ) : (
            <Link replace href={loginHref(nextPath)}>
              {t("login")}
            </Link>
          )}
        </Button>
      </span>
    </div>
  );
}
