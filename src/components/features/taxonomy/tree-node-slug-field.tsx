"use client";

import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import { FieldError } from "@/components/shared/field-error";
import { SlugInput } from "@/components/shared/slug-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type TreeNodeSlugFieldLabels = {
  /** Field label and the accessible name of the inline input. */
  slugPlaceholder: string;
  /** Shown while the node has no slug (the backend generates it). */
  slugAuto: string;
  slugEdit: string;
  slugDone: string;
};

type TreeNodeSlugFieldProps = {
  slug: string;
  labels: TreeNodeSlugFieldLabels;
  /** Resolved error message; keeps the input open while set. */
  error?: string;
  onSlugChange: (slug: string) => void;
};

/**
 * Per-node slug control for the taxonomy tree: muted text with a pencil toggle
 * that reveals an inline `SlugInput`. Kept compact because most nodes never
 * need a manual slug.
 */
export function TreeNodeSlugField({
  slug,
  labels,
  error,
  onSlugChange,
}: TreeNodeSlugFieldProps) {
  const [editing, setEditing] = useState(false);
  const isOpen = editing || Boolean(error);

  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">
        {labels.slugPlaceholder}
      </Label>
      {isOpen ? (
        <div className="flex items-center gap-1">
          <SlugInput
            aria-label={labels.slugPlaceholder}
            aria-invalid={Boolean(error)}
            value={slug}
            onValueChange={onSlugChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.slugDone}
            onClick={() => setEditing(false)}
          >
            <Check aria-hidden />
          </Button>
        </div>
      ) : (
        <div className="flex min-h-8 items-center gap-1">
          <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
            {slug || labels.slugAuto}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={labels.slugEdit}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden />
          </Button>
        </div>
      )}
      {error ? (
        <FieldError error={{ type: "validate" }} message={error} />
      ) : null}
    </div>
  );
}
