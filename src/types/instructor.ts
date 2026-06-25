import type { ApiListQueryParams } from "@/types/api";

/** BE `domain.ReviewStatus*` values. */
export type InstructorReviewStatus = "pending" | "approved" | "rejected";

/** BE `domain.TicketStatus*` values. */
export type InstructorTicketStatus = "open" | "closed";

export type InstructorCertificate = {
  title: string;
  issuer: string;
  issued_year: number;
  credential_url?: string;
};

export type InstructorProfilePayload = {
  headline: string;
  bio: string;
  years_of_experience: number;
  current_job_title: string;
  current_company: string;
  cv_file_id: string;
  linkedin_url: string;
  github_url: string;
  portfolio_links: string[];
  certificates: InstructorCertificate[];
  intro_video_file_id: string;
};

export type InstructorUserIdentity = {
  full_name: string;
  avatar: string;
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
  profile: InstructorProfilePayload;
};

export type InstructorProfile = InstructorApplication;

export type InstructorExpertiseTopic = {
  id: string;
  user_id: string;
  topic_id: string;
  created_at: number;
  updated_at: number;
};

export type InstructorExpertiseSkill = {
  id: string;
  user_id: string;
  skill_id: string;
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
