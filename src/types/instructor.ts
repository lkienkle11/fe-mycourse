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
  id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar: string;
};

export type InstructorApplication = InstructorUserIdentity & {
  id: number;
  user_id: number;
  review_status: InstructorReviewStatus | string;
  rejection_reason?: string;
  profile: InstructorProfilePayload;
};

export type InstructorProfile = InstructorApplication;

export type InstructorExpertiseTopic = {
  id: number;
  user_id: number;
  topic_id: number;
  created_at: number;
  updated_at: number;
};

export type InstructorExpertiseSkill = {
  id: number;
  user_id: number;
  skill_id: number;
  created_at: number;
  updated_at: number;
};

export type InstructorTicket = {
  id: number;
  user_id: number;
  subject: string;
  status: InstructorTicketStatus | string;
  created_at: number;
  updated_at: number;
};

export type InstructorTicketMessage = {
  id: number;
  ticket_id: number;
  author_user_id: number;
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

export type AddRosterPayload = {
  email: string;
};

export type RejectApplicationPayload = {
  rejection_reason: string;
};

export type AddExpertiseTopicPayload = {
  topic_id: number;
};

export type AddExpertiseSkillPayload = {
  skill_id: number;
};

export type CreateTicketPayload = {
  subject: string;
};

export type AddTicketMessagePayload = {
  body: string;
};

export type UpsertProfileResponse = {
  id: number;
  user_id: number;
};
