"use client";

import type { FieldError as RHFFieldError } from "react-hook-form";

type FieldErrorProps = {
  error?: RHFFieldError;
  message: string;
};

/** Inline field validation message below a form control. */
export function FieldError({ error, message }: FieldErrorProps) {
  if (!error) return null;
  return <p className="text-xs text-destructive px-1">{message}</p>;
}
