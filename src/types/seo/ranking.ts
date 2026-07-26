import type { CourseListItem, CourseVersion } from "@/types/course";
import type {
  InstructorRosterMember,
  InstructorUserIdentity,
} from "@/types/instructor";

export type JsonLdObject = Record<string, unknown>;

export type ArticleJsonLdInput = {
  headline: string;
  description: string;
  url: string;
  imageUrl: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
};

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type CourseJsonLdInput = {
  /** Published list/detail fields — not home mock CourseType. */
  course: Pick<CourseListItem, "slug" | "title" | "thumbnail_url"> &
    Partial<Pick<CourseVersion, "short_description" | "about_course">>;
  url: string;
  providerName: string;
  /** Optional Quill Delta JSON or plain about text already trusted by caller. */
  aboutDeltaOrPlain?: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type OrganizationJsonLdInput = {
  name: string;
  url: string;
  logoUrl?: string;
  sameAs?: readonly string[];
};

export type PersonJsonLdInput = {
  person: Pick<InstructorUserIdentity, "full_name" | "avatar"> &
    Partial<Pick<InstructorRosterMember, "id" | "email">>;
  url: string;
  jobTitle?: string;
};

export type VideoJsonLdInput = {
  name: string;
  description: string;
  thumbnailUrl: string;
  contentUrl: string;
  uploadDate: string;
  /** ISO 8601 duration, e.g. PT5M30S — required when known. */
  duration: string;
};
