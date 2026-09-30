"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { sanitizeSlugInput } from "@/lib/utils/slug";

export type SlugInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * Editable slug field. Every change (typing or paste) is filtered through
 * `sanitizeSlugInput`, so only `a-z`, `0-9`, `-` ever reach the caller.
 */
export function SlugInput({ value, onValueChange, ...props }: SlugInputProps) {
  return (
    <Input
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      {...props}
      value={value}
      onChange={(event) => onValueChange(sanitizeSlugInput(event.target.value))}
    />
  );
}
