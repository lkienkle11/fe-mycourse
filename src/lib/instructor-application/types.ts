export type InstructorApplicationReviewStatus =
  | "pending"
  | "returned"
  | "rejected"
  | "approved";

export type InstructorApplicationPageState =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H";

export type InstructorApplicationActiveTab = "info" | "history";

export type YearsExperienceCode =
  | "UNDER_1_YEAR"
  | "ONE_TO_TWO_YEARS"
  | "THREE_TO_FIVE_YEARS"
  | "SIX_TO_TEN_YEARS"
  | "OVER_TEN_YEARS";

export const YEAR_EXPERIENCE_BUCKETS = [
  { code: "UNDER_1_YEAR", labelKey: "under1" },
  { code: "ONE_TO_TWO_YEARS", labelKey: "oneToTwo" },
  { code: "THREE_TO_FIVE_YEARS", labelKey: "threeToFive" },
  { code: "SIX_TO_TEN_YEARS", labelKey: "sixToTen" },
  { code: "OVER_TEN_YEARS", labelKey: "overTen" },
] as const;

export type YearsExperienceLabelKey =
  (typeof YEAR_EXPERIENCE_BUCKETS)[number]["labelKey"];

export type ComboboxSuggestion = {
  id: string;
  label: string;
  description?: string;
  location?: string;
  domain?: string;
};

export type CompanySearchState = "idle" | "searching" | "fallback";
