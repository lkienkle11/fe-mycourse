"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ApiListQueryParams } from "@/types/api";

export type DataTableRow = {
  id: number | string;
};

export type DataTableColumn<TRow extends DataTableRow> = {
  id: string;
  header: ReactNode;
  sortKey?: string;
  cell: (row: TRow) => ReactNode;
};

export type DataTableProps<TRow extends DataTableRow> = {
  columns: DataTableColumn<TRow>[];
  rows: TRow[];
  sort?: Pick<ApiListQueryParams, "sort_by" | "sort_desc">;
  onSortChange?: (sortKey: string) => void;
  renderActions?: (row: TRow) => ReactNode;
  actionsHeader?: ReactNode;
  emptyMessage?: ReactNode;
  actionsColumnClassName?: string;
};

/** Sortable-column data table for admin list screens. */
export function DataTable<TRow extends DataTableRow>({
  columns,
  rows,
  sort,
  onSortChange,
  renderActions,
  actionsHeader = "Actions",
  emptyMessage = "No items found.",
  actionsColumnClassName = "w-[140px]",
}: DataTableProps<TRow>) {
  const showActions = Boolean(renderActions);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const isSorted = sort?.sort_by === column.sortKey;
              const sortIcon =
                !column.sortKey || !onSortChange ? null : isSorted ? (
                  sort?.sort_desc ? (
                    <ArrowDown className="size-3.5" />
                  ) : (
                    <ArrowUp className="size-3.5" />
                  )
                ) : (
                  <ArrowUpDown className="size-3.5 opacity-50" />
                );

              return (
                <TableHead key={column.id}>
                  {column.sortKey && onSortChange ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-8 gap-1 px-2"
                      onClick={() => {
                        if (column.sortKey) onSortChange(column.sortKey);
                      }}
                    >
                      {column.header}
                      {sortIcon}
                    </Button>
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
            {showActions ? (
              <TableHead className={actionsColumnClassName}>
                {actionsHeader}
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (showActions ? 1 : 0)}
                className="text-center"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((column) => (
                  <TableCell key={column.id}>{column.cell(row)}</TableCell>
                ))}
                {showActions ? (
                  <TableCell>{renderActions?.(row)}</TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
