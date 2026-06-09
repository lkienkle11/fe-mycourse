"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  id: string;
};

export type DataTableColumn<TRow extends DataTableRow> = {
  id: string;
  header: ReactNode;
  sortKey?: string;
  cell: (row: TRow) => ReactNode;
};

export type DataTableFilterByOption = {
  value: string;
  label: ReactNode;
  customInputComponent?: ReactNode;
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
  filterByOptions?: DataTableFilterByOption[];
  selectedFilterBy?: string;
  onFilterByChange?: (value: string) => void;
  filterByLabel?: ReactNode;
  searchValue?: string;
  searchPlaceholder?: string;
  searchButtonLabel?: ReactNode;
  onSearchValueChange?: (value: string) => void;
  onSearchSubmit?: () => void;
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
  filterByOptions,
  selectedFilterBy,
  onFilterByChange,
  filterByLabel = "Filter by",
  searchValue = "",
  searchPlaceholder = "Search...",
  searchButtonLabel = "Search",
  onSearchValueChange,
  onSearchSubmit,
}: DataTableProps<TRow>) {
  const showActions = Boolean(renderActions);
  const showFilterBy = Boolean(filterByOptions?.length && onFilterByChange);
  const selectedFilterOption = filterByOptions?.find(
    (option) => option.value === selectedFilterBy,
  );
  const customInputComponent = selectedFilterOption?.customInputComponent;
  const showCustomInput =
    customInputComponent !== null && customInputComponent !== undefined;
  const showSearch = !showCustomInput && Boolean(onSearchValueChange);
  const showSearchButton = showSearch && Boolean(onSearchSubmit);
  const showToolbar = showFilterBy || showCustomInput || showSearch;

  return (
    <div className="rounded-md border">
      {showToolbar ? (
        <div className="flex flex-col gap-2 border-b p-3 sm:flex-row sm:items-center">
          {showFilterBy ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filterByLabel}
              </span>
              <Select value={selectedFilterBy} onValueChange={onFilterByChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterByOptions?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {showSearch ? (
            <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
              <Input
                value={searchValue}
                placeholder={searchPlaceholder}
                onChange={(event) => onSearchValueChange?.(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSearchSubmit?.();
                }}
                className="max-w-sm"
              />
              {showSearchButton ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onSearchSubmit}
                >
                  {searchButtonLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
          {showCustomInput ? (
            <div className="w-full sm:ml-auto sm:w-auto">
              {customInputComponent}
            </div>
          ) : null}
        </div>
      ) : null}
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
