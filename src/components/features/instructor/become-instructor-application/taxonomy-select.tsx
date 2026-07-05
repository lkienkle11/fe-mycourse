"use client";

import type { ComponentProps } from "react";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { cn } from "@/lib/utils";

type TaxonomySelectProps = ComponentProps<typeof SearchableSelect>;

/** Section 6 full-width wrapper — keeps shared SearchableSelect unchanged for other screens. */
export function TaxonomySelect({
  triggerClassName,
  ...props
}: TaxonomySelectProps) {
  return (
    <div className="grid w-full grid-cols-1">
      <SearchableSelect
        {...props}
        triggerClassName={cn("w-full min-w-0", triggerClassName)}
      />
    </div>
  );
}
