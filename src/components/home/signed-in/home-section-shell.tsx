"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

type HomeSectionShellProps = {
  title: string;
  description: string;
  isLoading: boolean;
  hasError: boolean;
  isEmpty: boolean;
  onRetry: () => void;
  skeletonCount: number;
  /** Grid classes shared by the skeleton placeholders and the content. */
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
      <div className={gridClassName} aria-hidden>
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
    body = <div className={gridClassName}>{children}</div>;
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
