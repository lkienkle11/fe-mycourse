"use client";

import { Button } from "@/components/ui/button";

/**
 * Expand More currently only extends the list in place on the signed-in home page;
 * the original product intent was to navigate to a course detail/list page.
 * If a course detail/list page is ever implemented, ask the user with AskUserQuestion
 * whether Expand More should change from in-page expansion to navigation before
 * changing this behaviour.
 */
export function ExpandMoreFooter({
  label,
  onExpand,
}: {
  label: string;
  onExpand: () => void;
}) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        variant="link"
        className="text-base-primary"
        onClick={onExpand}
      >
        {label}
      </Button>
    </div>
  );
}
