"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SEARCHABLE_SELECT_LOAD_MORE_THRESHOLD_PX } from "@/constants/searchable-select";
import type { SearchableSelectOption } from "@/hooks/searchable-select/use-searchable-paginated-options";
import { cn } from "@/lib/utils";

type SearchableSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  loadingLabel?: string;
  /** Pinned label from `useSearchablePaginatedOptions.selectedLabel`. */
  selectedLabel?: string | null;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  value,
  onValueChange,
  options,
  open,
  onOpenChange,
  searchInput,
  onSearchInputChange,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onLoadMore,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  loadingLabel,
  selectedLabel,
  className,
  triggerClassName,
  disabled = false,
}: SearchableSelectProps) {
  const displayLabel = useMemo(() => {
    if (!value) {
      return null;
    }
    return (
      selectedLabel ??
      options.find((option) => option.value === value)?.label ??
      null
    );
  }, [options, selectedLabel, value]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!hasMore || isLoading || isLoadingMore || !onLoadMore) {
        return;
      }
      const target = event.currentTarget;
      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;
      if (distanceFromBottom <= SEARCHABLE_SELECT_LOAD_MORE_THRESHOLD_PX) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, isLoadingMore, onLoadMore],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            triggerClassName,
          )}
        >
          <span className="truncate">
            {displayLabel ?? placeholder ?? "Select…"}
          </span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-(--radix-popover-trigger-width) p-0", className)}
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchInput}
            onValueChange={onSearchInputChange}
          />
          <CommandList onScroll={handleScroll} className="max-h-60">
            {isLoading && options.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {loadingLabel ?? "Loading…"}
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyLabel ?? "No results."}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={(nextValue) => {
                        onValueChange(nextValue === value ? "" : nextValue);
                        onOpenChange(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
                {isLoadingMore ? (
                  <div className="py-2 text-center text-xs text-muted-foreground">
                    {loadingLabel ?? "Loading…"}
                  </div>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
