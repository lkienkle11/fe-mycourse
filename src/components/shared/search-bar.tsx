"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

type SearchBarProps = {
  onSearch?: (keyword: string) => void;
  defaultValue?: string;
  placeholderText?: string;
  wrapClassName?: string;
  inputClassName?: string;
  searchButtonClassName?: string;
};

export const SearchBar = ({
  onSearch,
  defaultValue = "",
  placeholderText = "",
  wrapClassName,
  inputClassName,
  searchButtonClassName,
}: SearchBarProps) => {
  const [keyword, setKeyword] = useState(defaultValue);

  const handleSearch = () => {
    onSearch?.(keyword.trim());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  return (
    <div
      className={cn(
        "hidden w-full max-w-xl items-center md:flex",
        wrapClassName,
      )}
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center overflow-hidden rounded-md border border-input bg-background"
      >
        <Input
          type="text"
          placeholder={placeholderText}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          className={cn(
            "h-11 rounded-none border-0 px-4 text-sm shadow-none focus-visible:ring-0",
            inputClassName,
          )}
        />
        <Button
          type="submit"
          aria-label="Search"
          className={cn(
            "inline-flex h-11 w-12 items-center justify-center text-foreground hover:bg-muted",
            searchButtonClassName,
          )}
          variant="ghost"
        >
          <Search className="size-4" />
        </Button>
      </form>
    </div>
  );
};
