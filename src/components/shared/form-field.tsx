"use client";

import type { ReactNode } from "react";
import type { FieldError as RHFFieldError } from "react-hook-form";
import { FieldError } from "./field-error";
import { RequiredLabel } from "./required-label";

export type FormFieldProps = {
  /** Control id; becomes the label `htmlFor`. */
  id: string;
  label: ReactNode;
  /** Shows the required marker (default true, like `RequiredLabel`). */
  required?: boolean;
  hint?: ReactNode;
  /** react-hook-form field error; the message is rendered only when set. */
  error?: RHFFieldError;
  errorMessage?: string;
  /** The control (`Input`, `SlugInput`, …). */
  children: ReactNode;
};

/** Labelled form control: label + control + optional muted hint + inline error. */
export function FormField({
  id,
  label,
  required = true,
  hint,
  error,
  errorMessage = "",
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <RequiredLabel htmlFor={id} required={required}>
        {label}
      </RequiredLabel>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldError error={error} message={errorMessage} />
    </div>
  );
}
