"use client";

import { Button } from "@/components/ui/button";

export type InstructorListPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageOfLabel: string;
};

export function InstructorListPagination({
  page,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageOfLabel,
}: InstructorListPaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <Button
        type="button"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        {previousLabel}
      </Button>
      <p className="text-sm text-muted-foreground">{pageOfLabel}</p>
      <Button
        type="button"
        variant="outline"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
