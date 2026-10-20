"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Below `sm` the items of every home section form one swipeable row (native
 * scroll-snap, like the hero carousel; each item takes 85% of the width so the
 * next one peeks in). From `sm` up the row becomes a grid and the item sizing
 * is reset, so `gridClassName` only needs to describe the grid from `sm`.
 */
const MOBILE_CAROUSEL_CLASS_NAME =
  "flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden *:w-[85%] *:shrink-0 *:snap-start sm:grid sm:overflow-visible sm:*:w-auto sm:*:shrink sm:*:snap-align-none";

type HomeSectionShellProps = {
  title: string;
  description: string;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  skeletonCount: number;
  /** Grid classes (applied from `sm` up) shared by the skeleton placeholders and the content. */
  gridClassName: string;
  skeletonItemClassName: string;
  emptyMessage: string;
  errorMessage: string;
  retryLabel: string;
  footer?: ReactNode;
  children: ReactNode;
};

/** Title and description, then loading skeletons, an empty state, an error state with retry, or the content. */
export function HomeSectionShell({
  title,
  description,
  isLoading,
  hasError,
  isEmpty,
  onRetry,
  skeletonCount,
  gridClassName,
  skeletonItemClassName,
  emptyMessage,
  errorMessage,
  retryLabel,
  footer,
  children,
}: HomeSectionShellProps) {
  let body: ReactNode;
  if (isLoading) {
    body = (
      <div
        className={cn(MOBILE_CAROUSEL_CLASS_NAME, gridClassName)}
        aria-hidden
      >
        {[...Array(skeletonCount).keys()].map((placeholderId) => (
          <Skeleton key={placeholderId} className={skeletonItemClassName} />
        ))}
      </div>
    );
  } else if (hasError) {
    body = (
      <Empty className="border" role="alert">
        <EmptyHeader>
          <EmptyDescription>{errorMessage}</EmptyDescription>
        </EmptyHeader>
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      </Empty>
    );
  } else if (isEmpty) {
    body = (
      <Empty className="border">
        <EmptyHeader>
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    body = (
      <div className={cn(MOBILE_CAROUSEL_CLASS_NAME, gridClassName)}>
        {children}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <header>
        <h2 className="text-xl font-bold leading-[26px] text-black">{title}</h2>
        <p className="font-gilroy text-sm leading-6 text-object-black/60">
          {description}
        </p>
      </header>
      {body}
      {!isLoading && !hasError && !isEmpty ? footer : null}
    </section>
  );
}
