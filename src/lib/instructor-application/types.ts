export type ComboboxSuggestion = {
  id: string;
  label: string;
  description?: string;
  location?: string;
  domain?: string;
};

export type CompanySearchState = "idle" | "searching" | "fallback";
