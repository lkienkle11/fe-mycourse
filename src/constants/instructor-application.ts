import type { YearsExperienceCode } from "@/types/instructor";

/** Runtime page states (docs A–H map to these names in instructor-application.md). */
export const INSTRUCTOR_PAGE_STATE = {
  unauthenticated: "unauthenticated",
  submit_blocked: "submit_blocked",
  ready_to_apply: "ready_to_apply",
  pending_review: "pending_review",
  returned_for_revision: "returned_for_revision",
  rejected_can_resubmit: "rejected_can_resubmit",
  approved: "approved",
  rejected_contact_admin: "rejected_contact_admin",
} as const;

export const YEAR_EXPERIENCE_BUCKETS: ReadonlyArray<{
  code: YearsExperienceCode;
  labelKey: "under1" | "oneToTwo" | "threeToFive" | "sixToTen" | "overTen";
}> = [
  { code: "UNDER_1_YEAR", labelKey: "under1" },
  { code: "ONE_TO_TWO_YEARS", labelKey: "oneToTwo" },
  { code: "THREE_TO_FIVE_YEARS", labelKey: "threeToFive" },
  { code: "SIX_TO_TEN_YEARS", labelKey: "sixToTen" },
  { code: "OVER_TEN_YEARS", labelKey: "overTen" },
];
