import { INSTRUCTOR_PAGE_STATE } from "@/constants/instructor-application";

export { INSTRUCTOR_PAGE_STATE };

export type InstructorApplicationPageState =
  (typeof INSTRUCTOR_PAGE_STATE)[keyof typeof INSTRUCTOR_PAGE_STATE];

export type InstructorApplicationActiveTab = "info" | "history";

export type YearsExperienceLabelKey =
  | "under1"
  | "oneToTwo"
  | "threeToFive"
  | "sixToTen"
  | "overTen";
