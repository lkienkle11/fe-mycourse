"use client";

import { LockKeyhole, LockKeyholeOpen, Mail, User } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type {
  FieldError as RHFFieldError,
  UseFormRegisterReturn,
} from "react-hook-form";
import { FieldError } from "@/components/shared/field-error";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { resolveValidationMessage } from "@/lib/utils/validation-message";

const inputGroupClassName =
  "h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0";

const inputClassName =
  "placeholder:text-object-black/10 placeholder:text-base text-base px-4";

type AuthEmailFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  error?: RHFFieldError;
};

export function AuthEmailField({
  register,
  placeholder,
  error,
}: AuthEmailFieldProps) {
  const t = useTranslations("auth");
  const errorMessage = resolveValidationMessage(t, error?.message);
  return (
    <div className="space-y-1">
      <InputGroup className={inputGroupClassName}>
        <InputGroupInput
          className={inputClassName}
          type="email"
          placeholder={placeholder}
          {...register}
        />
        <InputGroupAddon align="inline-end" className="mr-2">
          <Mail />
        </InputGroupAddon>
      </InputGroup>
      <FieldError error={error} message={errorMessage} />
    </div>
  );
}

type AuthPasswordFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  error?: RHFFieldError;
  hint?: ReactNode;
};

type AuthEmailPasswordFieldsProps = {
  registerEmail: UseFormRegisterReturn;
  registerPassword: UseFormRegisterReturn;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  emailError?: RHFFieldError;
  passwordError?: RHFFieldError;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  passwordHint?: ReactNode;
};

/** Shared email + password block for login and signup forms. */
export function AuthEmailPasswordFields({
  registerEmail,
  registerPassword,
  emailPlaceholder,
  passwordPlaceholder,
  emailError,
  passwordError,
  showPassword,
  onToggleShowPassword,
  passwordHint,
}: AuthEmailPasswordFieldsProps) {
  return (
    <>
      <AuthEmailField
        register={registerEmail}
        placeholder={emailPlaceholder}
        error={emailError}
      />
      <AuthPasswordField
        register={registerPassword}
        placeholder={passwordPlaceholder}
        showPassword={showPassword}
        onToggleShowPassword={onToggleShowPassword}
        error={passwordError}
        hint={passwordHint}
      />
    </>
  );
}

type AuthFullNameFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  error?: RHFFieldError;
};

export function AuthFullNameField({
  register,
  placeholder,
  error,
}: AuthFullNameFieldProps) {
  const t = useTranslations("auth");
  const errorMessage = resolveValidationMessage(t, error?.message);
  return (
    <div className="space-y-1">
      <InputGroup className={inputGroupClassName}>
        <InputGroupInput
          className={inputClassName}
          type="text"
          placeholder={placeholder}
          {...register}
        />
        <InputGroupAddon align="inline-end" className="mr-2">
          <User />
        </InputGroupAddon>
      </InputGroup>
      <FieldError error={error} message={errorMessage} />
    </div>
  );
}

export function AuthPasswordField({
  register,
  placeholder,
  showPassword,
  onToggleShowPassword,
  error,
  hint,
}: AuthPasswordFieldProps) {
  const t = useTranslations("auth");
  const errorMessage = resolveValidationMessage(t, error?.message);
  return (
    <div className="space-y-1">
      <InputGroup className={inputGroupClassName}>
        <InputGroupInput
          className={inputClassName}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...register}
        />
        <InputGroupAddon
          align="inline-end"
          className="mr-2 hover:cursor-pointer"
          onClick={onToggleShowPassword}
        >
          {showPassword ? <LockKeyholeOpen /> : <LockKeyhole />}
        </InputGroupAddon>
      </InputGroup>
      {error ? <FieldError error={error} message={errorMessage} /> : hint}
    </div>
  );
}
