"use client";

import { LockKeyhole, LockKeyholeOpen, Mail, User } from "lucide-react";
import type { ReactNode } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

const inputGroupClassName =
  "h-12 border-none shadow-0 shadow-none bg-object-white/90 has-[[data-slot=input-group-control]:focus-visible]:ring-0";

const inputClassName =
  "placeholder:text-object-black/10 placeholder:text-base text-base px-4";

type AuthFieldErrorProps = {
  error?: FieldError;
  message: string;
};

function AuthFieldError({ error, message }: AuthFieldErrorProps) {
  if (!error) return null;
  return <p className="text-xs text-destructive px-1">{message}</p>;
}

type AuthEmailFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  error?: FieldError;
  errorMessage: string;
};

export function AuthEmailField({
  register,
  placeholder,
  error,
  errorMessage,
}: AuthEmailFieldProps) {
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
      <AuthFieldError error={error} message={errorMessage} />
    </div>
  );
}

type AuthPasswordFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  error?: FieldError;
  errorMessage: string;
  hint?: ReactNode;
};

type AuthEmailPasswordFieldsProps = {
  registerEmail: UseFormRegisterReturn;
  registerPassword: UseFormRegisterReturn;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  emailError?: FieldError;
  passwordError?: FieldError;
  emailErrorMessage: string;
  passwordErrorMessage: string;
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
  emailErrorMessage,
  passwordErrorMessage,
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
        errorMessage={emailErrorMessage}
      />
      <AuthPasswordField
        register={registerPassword}
        placeholder={passwordPlaceholder}
        showPassword={showPassword}
        onToggleShowPassword={onToggleShowPassword}
        error={passwordError}
        errorMessage={passwordErrorMessage}
        hint={passwordHint}
      />
    </>
  );
}

type AuthFullNameFieldProps = {
  register: UseFormRegisterReturn;
  placeholder: string;
  error?: FieldError;
  errorMessage: string;
};

export function AuthFullNameField({
  register,
  placeholder,
  error,
  errorMessage,
}: AuthFullNameFieldProps) {
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
      <AuthFieldError error={error} message={errorMessage} />
    </div>
  );
}

export function AuthPasswordField({
  register,
  placeholder,
  showPassword,
  onToggleShowPassword,
  error,
  errorMessage,
  hint,
}: AuthPasswordFieldProps) {
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
      {error ? <AuthFieldError error={error} message={errorMessage} /> : hint}
    </div>
  );
}
