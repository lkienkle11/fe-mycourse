"use client";

import type * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RequiredLabelProps = React.ComponentProps<typeof Label> & {
  required?: boolean;
};

/** Label with optional required asterisk — extends shadcn `Label`. */
export function RequiredLabel({
  required = true,
  className,
  children,
  ...props
}: RequiredLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required ? (
        <span className="text-destructive ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </Label>
  );
}
