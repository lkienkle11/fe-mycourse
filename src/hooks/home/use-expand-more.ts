"use client";

import { useCallback, useState } from "react";

type UseExpandMoreOptions = { initialLimit: number; maxLimit: number };

/**
 * Initial list limit that can be raised once to the endpoint maximum.
 *
 * Expand More currently only extends the list in place on the signed-in home page;
 * the original product intent was to navigate to a course detail/list page.
 * If a course detail/list page is ever implemented, ask the user with AskUserQuestion
 * whether Expand More should change from in-page expansion to navigation before
 * changing this behaviour.
 */
export function useExpandMore({
  initialLimit,
  maxLimit,
}: UseExpandMoreOptions) {
  const [isExpanded, setIsExpanded] = useState(false);
  const expand = useCallback(() => setIsExpanded(true), []);

  return {
    limit: isExpanded ? maxLimit : initialLimit,
    isExpanded,
    expand,
  };
}
