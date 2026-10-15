"use client";

import { FormField, type FormFieldProps } from "./form-field";
import { SlugInput, type SlugInputProps } from "./slug-input";

export type SlugFieldProps = Omit<SlugInputProps, "id"> &
  Omit<FormFieldProps, "children">;

/**
 * Labelled slug field: `FormField` around a `SlugInput`. `name`, `ref`,
 * `onBlur`, `disabled` and `placeholder` pass through to the input, so it works
 * under react-hook-form `Controller` and with plain state.
 */
export function SlugField({
  id,
  label,
  required,
  hint,
  error,
  errorMessage,
  ...inputProps
}: SlugFieldProps) {
  return (
    <FormField
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      errorMessage={errorMessage}
    >
      <SlugInput id={id} {...inputProps} />
    </FormField>
  );
}
