"use client";

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { RequiredLabel } from "@/components/shared/required-label";
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
import { cn } from "@/lib/utils/index";
import { CONTENT_LOCALE_OPTIONS, localeTabLabel } from "@/lib/utils/taxonomy";

type TaxonomyLocaleTabsSectionProps = {
  activeLocale: string;
  tabLocales: string[];
  onActiveLocaleChange: (locale: string) => void;
  onAddLocale: (rawLocale: string) => void;
};

export function TaxonomyLocaleTabsSection({
  activeLocale,
  tabLocales,
  onActiveLocaleChange,
  onAddLocale,
}: TaxonomyLocaleTabsSectionProps) {
  const tForm = useTranslations("taxonomy.form");
  const [localePickerOpen, setLocalePickerOpen] = useState(false);
  const [localeSearch, setLocaleSearch] = useState("");

  const filteredLocaleOptions = useMemo(() => {
    const q = localeSearch.trim().toLowerCase();
    return CONTENT_LOCALE_OPTIONS.filter((item) => {
      if (!q) return true;
      return (
        item.locale.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q)
      );
    });
  }, [localeSearch]);

  const handleSelect = (raw: string) => {
    const alreadyOpen = tabLocales.includes(raw);
    if (alreadyOpen) {
      onActiveLocaleChange(raw);
    } else {
      onAddLocale(raw);
    }
    setLocalePickerOpen(false);
    setLocaleSearch("");
  };

  return (
    <div className="space-y-2">
      <RequiredLabel required={false}>{tForm("localeTabs")}</RequiredLabel>
      <Popover
        open={localePickerOpen}
        onOpenChange={(open) => {
          setLocalePickerOpen(open);
          if (!open) setLocaleSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-w-[220px] justify-between"
            aria-label={tForm("localeSearchPlaceholder")}
          >
            <span className="truncate">{localeTabLabel(activeLocale)}</span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start" portal={false}>
          <Command shouldFilter={false}>
            <CommandInput
              value={localeSearch}
              onValueChange={setLocaleSearch}
              placeholder={tForm("localeSearchPlaceholder")}
            />
            <CommandList className="scrollbar-app max-h-60 overflow-y-auto">
              <CommandEmpty>{tForm("localeEmpty")}</CommandEmpty>
              <CommandGroup>
                {filteredLocaleOptions.map((item) => {
                  const isActive = item.locale === activeLocale;
                  return (
                    <CommandItem
                      key={item.locale}
                      value={item.locale}
                      onSelect={() => handleSelect(item.locale)}
                    >
                      <CheckIcon
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
