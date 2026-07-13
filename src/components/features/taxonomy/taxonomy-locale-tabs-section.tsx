"use client";

import { ChevronsUpDownIcon } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const availableLocaleOptions = useMemo(() => {
    const used = new Set(tabLocales);
    const q = localeSearch.trim().toLowerCase();
    return CONTENT_LOCALE_OPTIONS.filter((item) => {
      if (used.has(item.locale)) return false;
      if (!q) return true;
      return (
        item.locale.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q)
      );
    });
  }, [localeSearch, tabLocales]);

  const handleAdd = (raw: string) => {
    onAddLocale(raw);
    setLocalePickerOpen(false);
    setLocaleSearch("");
  };

  return (
    <div className="space-y-2">
      <RequiredLabel required={false}>{tForm("localeTabs")}</RequiredLabel>
      <Tabs value={activeLocale} onValueChange={onActiveLocaleChange}>
        <TabsList className="flex h-auto flex-wrap gap-1">
          {tabLocales.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              {localeTabLabel(locale)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {availableLocaleOptions.length > 0 ? (
        <Popover open={localePickerOpen} onOpenChange={setLocalePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-w-[220px] justify-between"
              aria-label={tForm("localeSearchPlaceholder")}
            >
              <span className="truncate text-muted-foreground">
                {tForm("localeSearchPlaceholder")}
              </span>
              <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                value={localeSearch}
                onValueChange={setLocaleSearch}
                placeholder={tForm("localeSearchPlaceholder")}
              />
              <CommandList className="max-h-60">
                <CommandEmpty>{tForm("localeEmpty")}</CommandEmpty>
                <CommandGroup>
                  {availableLocaleOptions.map((item) => (
                    <CommandItem
                      key={item.locale}
                      value={item.locale}
                      onSelect={() => handleAdd(item.locale)}
                    >
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
