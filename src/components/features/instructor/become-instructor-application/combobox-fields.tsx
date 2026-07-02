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
import type {
  ComboboxSuggestion,
  CompanySearchState,
} from "@/lib/instructor-application/types";
import type { FormState } from "./form-state";
import { Field } from "./sections";

type AsyncComboboxFieldProps = {
  label: string;
  value: string;
  selectedId?: string;
  readonly: boolean;
  placeholder: string;
  onSelect: (label: string, id: string) => void;
  fetchSuggestions: (query: string) => Promise<ComboboxSuggestion[]>;
};

function AsyncComboboxFieldInner({
  label,
  value,
  selectedId,
  readonly,
  placeholder,
  onSelect,
  fetchSuggestions,
}: AsyncComboboxFieldProps) {
  const t = useTranslations("instructor.application.form");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<ComboboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || readonly) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      void fetchSuggestions(query).then((items) => {
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
  }, [open, query, readonly, fetchSuggestions]);

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
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            onSelect(e.target.value, "");
          }}
          onFocus={() => setOpen(true)}
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
              <button
                key={`${item.id}-${item.label}`}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => {
                  onSelect(
                    item.label,
                    item.id || deriveCustomJobTitleId(item.label),
                  );
                  setQuery(item.label);
                  setOpen(false);
                }}
              >
                <span className="font-medium">{item.label}</span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                ) : null}
              </button>
            ))}
            {query.trim().length >= 2 ? (
              <button
                type="button"
                className="block w-full border-t px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => {
                  const id = deriveCustomJobTitleId(query);
                  onSelect(query.trim(), id);
                  setOpen(false);
                }}
              >
                {t("useCustom", { value: query.trim() })}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {selectedId ? (
        <p className="mt-1 text-xs text-muted-foreground">{selectedId}</p>
      ) : null}
    </Field>
  );
}

export function AsyncComboboxField(props: AsyncComboboxFieldProps) {
  return (
    <AsyncComboboxFieldInner
      key={`${props.value}-${props.selectedId ?? ""}`}
      {...props}
    />
  );
}

type CompanyComboboxFieldProps = {
  label: string;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  readonly: boolean;
};

function CompanyComboboxFieldInner({
  label,
  form,
  setForm,
  readonly,
}: CompanyComboboxFieldProps) {
  const t = useTranslations("instructor.application.form");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(form.current_company);
  const [suggestions, setSuggestions] = useState<ComboboxSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchState, setSearchState] = useState<CompanySearchState>("idle");

  useEffect(() => {
    if (!open || readonly) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      setSearchState(query.trim().length >= 2 ? "searching" : "idle");
      void fetchCompanySuggestions(query).then((items) => {
        if (!cancelled) {
          setSuggestions(items);
          setLoading(false);
          setSearchState(
            items.length === 0 && query.trim().length >= 2
              ? "fallback"
              : "idle",
          );
        }
      });
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, readonly]);

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
    setQuery(resolved.label);
    setOpen(false);
  };

  if (readonly) {
    return (
      <Field label={label} required>
        <Input value={form.current_company} readOnly />
      </Field>
    );
  }

  return (
    <Field label={label} required>
      <div className="relative">
        <Input
          value={query}
          placeholder={t("companyPlaceholder")}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setForm((prev) => ({
              ...prev,
              current_company: e.target.value,
              current_company_id: "",
              current_company_domain: "",
              current_company_description: "",
              current_company_location: "",
            }));
          }}
          onFocus={() => setOpen(true)}
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
              <button
                key={`${item.id}-${item.label}`}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={() => selectSuggestion(item, index)}
              >
                <span className="font-medium">{item.label}</span>
                {item.description ? (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {item.description}
                  </span>
                ) : null}
              </button>
            ))}
            <p className="border-t px-3 py-2 text-xs text-muted-foreground">
              {getCompanySourceNote(
                searchState,
                t("companySourceFallback"),
                t("companySourceIdle"),
                t("companySourceSearching"),
              )}
            </p>
          </div>
        ) : null}
      </div>
      {form.current_company_description ? (
        <p className="mt-1 text-xs text-muted-foreground">
          {form.current_company_description}
        </p>
      ) : null}
    </Field>
  );
}

export function CompanyComboboxField(props: CompanyComboboxFieldProps) {
  return (
    <CompanyComboboxFieldInner
      key={`${props.form.current_company}-${props.form.current_company_id}`}
      {...props}
    />
  );
}
