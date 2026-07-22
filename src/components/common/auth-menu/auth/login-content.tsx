"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { registerAction } from "@/actions/auth";
import { handleAuthSubmit } from "@/actions/auth/auth-client";
import { Button, Spinner } from "@/components/ui";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ApiErrorCode } from "@/constants/api-error-code";
import { useAuthStore, useGetMe } from "@/hooks";
import { useDiscordLogin } from "@/hooks/auth/use-discord-login";
import { useGoogleLogin } from "@/hooks/auth/use-google-login";
import { useOAuthPostAuth } from "@/hooks/auth/use-oauth-post-auth";
import { useRouter } from "@/i18n/navigation";
// import { Link } from "@/i18n/navigation";
// import { forgotPasswordHref } from "@/lib/navigation/routes";
import { cn } from "@/lib/utils";
import { translateApiErrorCode } from "@/lib/utils/api-error";
import { type LoginFormValues, loginSchema } from "@/schema/auth";
import { AuthSocialLogin } from "../auth-social-login";
import { AuthEmailPasswordFields } from "./auth-form-fields";

export function LoginContent({ className }: { className?: string }) {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors.codes");
  const locale = useLocale();
  const router = useRouter();
  const { openSignupModal, closeAllModals, nextLink } = useAuthStore();
  const { mutateMe } = useGetMe();
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = useWatch({
    control,
    name: "rememberMe",
    defaultValue: false,
  });

  const handleOAuthSuccess = useOAuthPostAuth();

  const { startGoogleLogin, isPending: googleLoading } = useGoogleLogin({
    rememberMe: rememberMe ?? false,
    onSuccess: () => {
      toast.success(t("socialLogin.googleSuccess"));
      handleOAuthSuccess();
    },
    onCancel: () => toast.message(t("socialLogin.googleCancelled")),
    onError: (result) =>
      setServerError(translateApiErrorCode(tErrors, result.code)),
  });

  const { startDiscordLogin, isPending: discordLoading } = useDiscordLogin({
    entrypoint: "login",
    rememberMe: rememberMe ?? false,
    onSuccess: () => {
      toast.success(t("socialLogin.discordSuccess"));
      handleOAuthSuccess();
    },
    onCancel: () => toast.message(t("socialLogin.discordCancelled")),
    onError: (result) =>
      setServerError(translateApiErrorCode(tErrors, result.code)),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setEmailNotConfirmed(false);
    setResendMessage(null);
    const result = await handleAuthSubmit("login", values);
    if (result.success) {
      mutateMe();
      closeAllModals();
      if (nextLink) {
        router.push(nextLink);
      }
    } else if (result.code === ApiErrorCode.EmailNotConfirmed) {
      setEmailNotConfirmed(true);
      setServerError(translateApiErrorCode(tErrors, result.code));
    } else {
      setServerError(translateApiErrorCode(tErrors, result.code));
    }
  };

  const onResendConfirmation = async () => {
    const { email, password } = getValues();
    if (!email || !password) return;
    setResendPending(true);
    setResendMessage(null);
    const displayName = email.split("@")[0] || "User";
    const result = await registerAction({
      email,
      password,
      display_name: displayName,
      locale,
    });
    setResendPending(false);
    if (result.success) {
      setResendMessage(t("resend.success"));
    } else {
      setResendMessage(translateApiErrorCode(tErrors, result.code));
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <form onSubmit={handleSubmit(onSubmit)} className="contents space-y-3">
        <AuthEmailPasswordFields
          registerEmail={register("email")}
          registerPassword={register("password")}
          emailPlaceholder={t("email")}
          passwordPlaceholder={t("password")}
          emailError={errors.email}
          passwordError={errors.password}
          showPassword={showPassword}
          onToggleShowPassword={() => setShowPassword((prev) => !prev)}
        />

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
            {/* TODO(forgot-password-page): restore Link when /forgot-password exists
                (avoids Next prefetch 404). Keep forgotPasswordHref / PUBLIC_ROUTES.
            <Link
              href={forgotPasswordHref}
              className="hover:no-underline hover:cursor-pointer no-underline"
            >
              <Label className="hover:no-underline hover:cursor-pointer no-underline text-[#3DCBB1] hover:brightness-110 transition-all duration-300">
                {t("forgotPassword")}
              </Label>
            </Link>
            */}
            <Label className="cursor-default no-underline text-[#3DCBB1]/opacity-70">
              {t("forgotPassword")}
            </Label>
          </Field>
        </div>

        {serverError ? (
          <p className="text-xs text-destructive text-center px-1">
            {serverError}
          </p>
        ) : null}

        {emailNotConfirmed ? (
          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={resendPending}
              onClick={() => void onResendConfirmation()}
              className="w-full h-10 rounded-full text-sm"
            >
              {resendPending ? "..." : t("resend.cta")}
            </Button>
            {resendMessage ? (
              <p className="text-xs text-center text-black/70">
                {resendMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 text-sm font-medium flex items-center justify-center bg-base-primary rounded-full leading-[21px] hover:cursor-pointer hover:brightness-110 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? <Spinner className="size-4" /> : t("login")}
        </Button>
      </form>

      <span className="flex justify-center items-center text-sm leading-[18px] font-normal text-black mt-2">
        {t("socialLogin.title")}
      </span>
      <AuthSocialLogin
        type="login"
        onGoogleClick={() => startGoogleLogin()}
        googleLoading={googleLoading}
        onDiscordClick={() => void startDiscordLogin()}
        discordLoading={discordLoading}
      />
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
