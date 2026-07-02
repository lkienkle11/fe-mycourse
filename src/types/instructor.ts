import type { ApiListQueryParams } from "@/types/api";

/** BE `domain.ReviewStatus*` values for admin lists. */
export type InstructorReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "returned";

/** BE `domain.TicketStatus*` values. */
export type InstructorTicketStatus = "open" | "closed";

export type YearsExperienceCode =
  | "UNDER_1_YEAR"
  | "ONE_TO_TWO_YEARS"
  | "THREE_TO_FIVE_YEARS"
  | "SIX_TO_TEN_YEARS"
  | "OVER_TEN_YEARS";

export type InstructorMediaReadModel = {
  id: string;
  url: string;
  filename?: string;
  mime_type?: string;
};

export type InstructorCertificate = {
  title: string;
  issuer: string;
  issued_year: number;
  credential_url?: string;
};

export type InstructorCompanySnapshot = {
  current_company_id?: string | null;
  current_company_domain?: string | null;
  current_company_description?: string | null;
  current_company_location?: string | null;
};

export type InstructorApplicationProfile = InstructorCompanySnapshot & {
  headline: string;
  bio: string;
  years_of_experience: YearsExperienceCode | string;
  current_job_title: string;
  current_job_title_id?: string;
  current_company: string;
  cv_file_id?: string;
  cv_file?: InstructorMediaReadModel | null;
  linkedin_url?: string;
  github_url?: string;
  portfolio_links: string[];
  certificates: InstructorCertificate[];
  intro_video_file_id?: string;
  intro_video_file?: InstructorMediaReadModel | null;
};

/** @deprecated Use `InstructorApplicationProfile` — kept for legacy admin callers. */
export type InstructorProfilePayload = {
  headline: string;
  bio: string;
  years_of_experience: number | YearsExperienceCode | string;
  current_job_title: string;
  current_company: string;
  cv_file_id: string;
  linkedin_url: string;
  github_url: string;
  portfolio_links: string[];
  certificates: InstructorCertificate[];
  intro_video_file_id: string;
} & Partial<InstructorCompanySnapshot>;

export type InstructorTaxonomyChip = {
  id: string;
  name: string;
  slug?: string;
};

export type InstructorRejectionRecord = {
  rejected_at: number;
  rejected_by_user_id?: string;
  reviewer_display_name: string;
  reason: string;
};

export type InstructorLatestSubmission = {
  profile: InstructorApplicationProfile;
  topic_ids: string[];
  skill_ids: string[];
};

export type MyInstructorApplication = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  avatar?: string;
  review_status: InstructorReviewStatus | null;
  can_resubmit: boolean;
  rejection_count: number;
  rejection_reason?: string;
  submitted_at?: number;
  review_due_at?: number;
  returned_at?: number | null;
  latest_submission: InstructorLatestSubmission | null;
  rejection_history: InstructorRejectionRecord[];
  topics?: InstructorTaxonomyChip[];
  skills?: InstructorTaxonomyChip[];
};

export type SubmitInstructorApplicationPayload = {
  headline: string;
  bio: string;
  years_of_experience: YearsExperienceCode;
  current_job_title: string;
  current_job_title_id: string;
  current_company: string;
  current_company_id?: string | null;
  current_company_domain?: string | null;
  current_company_description?: string | null;
  current_company_location?: string | null;
  cv_file_id: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_links?: string[];
  certificates?: InstructorCertificate[];
  intro_video_file_id?: string;
  topic_ids: string[];
  skill_ids: string[];
};

export type ContactInstructorAdminPayload = {
  subject: string;
  message: string;
};

export type InstructorUserIdentity = {
  full_name: string;
  avatar: string;
  display_name?: string;
  email?: string;
};

export type InstructorRosterMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
};

export type InstructorApplication = InstructorUserIdentity & {
  id: string;
  user_id: string;
  review_status: InstructorReviewStatus | string;
  rejection_reason?: string;
  rejection_count?: number;
  submitted_at?: number;
  review_due_at?: number;
  returned_at?: number | null;
  latest_submission?: InstructorLatestSubmission | null;
  rejection_history?: InstructorRejectionRecord[];
  topics?: InstructorTaxonomyChip[];
  skills?: InstructorTaxonomyChip[];
  /** Legacy shape — prefer `latest_submission.profile`. */
  profile?: InstructorProfilePayload;
};

export type InstructorProfile = InstructorApplication;

export type InstructorExpertiseTopic = {
  id: string;
  user_id: string;
  topic_id: string;
  name?: string;
  slug?: string;
  created_at: number;
  updated_at: number;
};

export type InstructorExpertiseSkill = {
  id: string;
  user_id: string;
  skill_id: string;
  name?: string;
  slug?: string;
  created_at: number;
  updated_at: number;
};

export type InstructorTicket = {
  id: string;
  user_id: string;
  subject: string;
  status: InstructorTicketStatus | string;
  created_at: number;
  updated_at: number;
};

export type InstructorTicketMessage = {
  id: string;
  ticket_id: string;
  author_user_id: string;
  body: string;
  created_at: number;
  updated_at: number;
};

export type InstructorListFilters = ApiListQueryParams & {
  /** Application list: maps to BE `status` query (review status). */
  review_status?: InstructorReviewStatus;
  has_profile?: boolean;
};

export type InstructorTicketListFilters = Omit<ApiListQueryParams, "status"> & {
  /** Admin lists all tickets when `all` is set (BE `scope=all`). */
  scope?: "all";
  /** Ticket list filter (BE `status` query — not taxonomy ACTIVE/INACTIVE). */
  ticket_status?: InstructorTicketStatus;
};

export type AddRosterBulkPayload = {
  user_ids: string[];
};

export type AddRosterBulkFailure = {
  user_id: string;
  message: string;
};

export type AddRosterBulkResult = {
  added: InstructorRosterMember[];
  failed: AddRosterBulkFailure[];
};

export type RejectApplicationPayload = {
  rejection_reason: string;
};

export type AddExpertiseTopicPayload = {
  topic_id: string;
};

export type AddExpertiseSkillPayload = {
  skill_id: string;
};

export type CreateTicketPayload = {
  subject: string;
};

export type AddTicketMessagePayload = {
  body: string;
};

export type UpsertProfileResponse = {
  id: string;
  user_id: string;
};
