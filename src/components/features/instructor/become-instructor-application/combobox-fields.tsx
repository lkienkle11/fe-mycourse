"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  deriveCustomCompanyId,
  deriveCustomJobTitleId,
  fetchCompanySuggestions,
  getCompanySourceNote,
  resolveCompanySuggestionById,
} from "@/lib/instructor-application/combobox";
import type { FormState } from "@/lib/instructor-application/form-state";
import { applyCompanyFreeText } from "@/lib/instructor-application/form-state";
import type {
  ComboboxSuggestion,
  CompanySearchState,
} from "@/lib/instructor-application/types";
import { Field } from "./sections";

function ComboboxSuggestionOption({
  item,
  onPick,
}: {
  item: ComboboxSuggestion;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
      onMouseDown={onPick}
    >
      <span className="font-medium">{item.label}</span>
      {item.description ? (
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {item.description}
        </span>
      ) : null}
      {item.location ? (
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {item.location}
        </span>
      ) : null}
    </button>
  );
}

type AsyncComboboxFieldProps = {
  label: string;
  value: string;
  selectedId?: string;
  readonly: boolean;
  placeholder: string;
  onSelect: (label: string, id: string) => void;
  fetchSuggestions: (query: string) => Promise<ComboboxSuggestion[]>;
};

export function AsyncComboboxField({
  label,
  value,
  readonly,
  placeholder,
  onSelect,
  fetchSuggestions,
}: AsyncComboboxFieldProps) {
  const t = useTranslations("instructor.application.form");
  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ComboboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const displayQuery = open ? localQuery : value;

  useEffect(() => {
    if (!open || readonly) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchSuggestions(localQuery).then((items) => {
        if (!cancelled) {
          setSuggestions(items);
          setLoading(false);
        }
      });
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, localQuery, readonly, fetchSuggestions]);

  if (readonly) {
    return (
      <Field label={label} required>
        <Input value={value} readOnly />
      </Field>
    );
  }

  return (
    <Field label={label} required>
      <div className="relative">
        <Input
          value={displayQuery}
          placeholder={placeholder}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            setOpen(true);
            onSelect(e.target.value, "");
          }}
          onFocus={() => {
            setLocalQuery(value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">
                {t("loading")}
              </p>
            ) : null}
            {suggestions.map((item) => (
              <ComboboxSuggestionOption
                key={`${item.id}-${item.label}`}
                item={item}
                onPick={() => {
                  onSelect(
                    item.label,
                    item.id || deriveCustomJobTitleId(item.label),
                  );
                  setLocalQuery(item.label);
                  setOpen(false);
                }}
              />
            ))}
            {localQuery.trim().length >= 2 ? (
              <button
                type="button"
                className="block w-full border-t px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => {
                  const id = deriveCustomJobTitleId(localQuery);
                  onSelect(localQuery.trim(), id);
                  setOpen(false);
                }}
              >
                {t("useCustom", { value: localQuery.trim() })}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

type CompanyComboboxFieldProps = {
  label: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
};

export function CompanyComboboxField({
  label,
  form,
  setForm,
  readonly,
}: CompanyComboboxFieldProps) {
  const t = useTranslations("instructor.application.form");
  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ComboboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState<CompanySearchState>("idle");
  const displayQuery = open ? localQuery : form.current_company;

  useEffect(() => {
    if (!open || readonly) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setSearchState(localQuery.trim().length >= 2 ? "searching" : "idle");
      void fetchCompanySuggestions(localQuery).then((items) => {
        if (!cancelled) {
          setSuggestions(items);
          setLoading(false);
          setSearchState(
            items.length === 0 && localQuery.trim().length >= 2
              ? "no_results"
              : "idle",
          );
        }
      });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, localQuery, readonly]);

  const selectSuggestion = (item: ComboboxSuggestion, index: number) => {
    const resolved =
      resolveCompanySuggestionById(suggestions, item.id, index) ?? item;
    const companyId =
      resolved.domain?.trim() ||
      resolved.id ||
      deriveCustomCompanyId(resolved.label);
    setForm((prev) => ({
      ...prev,
      current_company: resolved.label,
      current_company_id: companyId,
      current_company_domain: resolved.domain ?? "",
      current_company_description: resolved.description ?? "",
      current_company_location: resolved.location ?? "",
    }));
    setLocalQuery(resolved.label);
    setOpen(false);
  };

  if (readonly) {
    return (
      <Field label={label} required>
        <Input value={form.current_company} readOnly />
      </Field>
    );
  }

  const companySourceNote = getCompanySourceNote(
    searchState,
    t("companySourceIdle"),
    t("companySourceSearching"),
    t("companySourceNoResults"),
  );

  return (
    <Field label={label} required>
      <div className="relative">
        <Input
          value={displayQuery}
          placeholder={t("companyPlaceholder")}
          onChange={(e) => {
            setLocalQuery(e.target.value);
            setOpen(true);
            setForm((prev) => applyCompanyFreeText(prev, e.target.value));
          }}
          onFocus={() => {
            setLocalQuery(form.current_company);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {open ? (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md">
            {loading ? (
              <p className="p-3 text-sm text-muted-foreground">
                {t("loading")}
              </p>
            ) : null}
            {suggestions.map((item, index) => (
              <ComboboxSuggestionOption
                key={`${item.id}-${item.label}`}
                item={item}
                onPick={() => selectSuggestion(item, index)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {companySourceNote ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {companySourceNote}
        </p>
      ) : null}
    </Field>
  );
}
