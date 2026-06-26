import type { ApiListQueryParams } from "@/types/api";
import type { UserPickerCandidate } from "@/types/user-picker";

export type CourseVersionStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export type CourseCollaboratorRole = "OWNER" | "EDITOR";

export type CourseResourceType =
  | "OUTLINE_ROOT"
  | "SECTION"
  | "LESSON"
  | "SUB_LESSON";

export type CourseSubLessonKind = "VIDEO" | "QUIZ" | "TEXT";

export type CourseProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export type Course = {
  id: string;
  owner_user_id: string;
  slug: string;
  current_published_version_id?: string;
  current_draft_version_id?: string;
  trashed_at?: number;
  created_at: number;
  updated_at: number;
};

export type CourseListItem = Course & {
  title: string;
  review_status: CourseVersionStatus | "";
  version_id?: string;
  version_no: number;
  collaborator_role: CourseCollaboratorRole;
  has_published: boolean;
  has_draft: boolean;
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  preview_video_file_id?: string;
  draft_review_status?: CourseVersionStatus | "";
};

export type CourseVersion = {
  id: string;
  course_id: string;
  version_no: number;
  status: CourseVersionStatus;
  based_on_version_id?: string;
  title: string;
  short_description: string;
  about_course: string;
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  preview_video_file_id?: string;
  preview_video_url?: string;
  course_level_id?: string;
  course_topic_id?: string;
  tag_ids: string[];
  skill_ids: string[];
  outcome_ids: string[];
  row_version: number;
  submitted_by_user_id?: string;
  submitted_at?: number;
  approved_by_user_id?: string;
  approved_at?: number;
  rejected_by_user_id?: string;
  rejected_at?: number;
  rejection_reason: string;
  created_at: number;
  updated_at: number;
};

export type CourseCollaborator = {
  user_id: string;
  role: CourseCollaboratorRole;
  display_name: string;
  email: string;
  avatar_file_id?: string;
  avatar_url?: string;
};

export type AddCollaboratorsBulkPayload = {
  user_ids: string[];
  role?: CourseCollaboratorRole;
};

export type AddCollaboratorsBulkFailure = {
  user_id: string;
  message: string;
};

export type AddCollaboratorsBulkResult = {
  added: CourseCollaborator[];
  failed: AddCollaboratorsBulkFailure[];
};

export type CourseQuizOption = {
  id: string;
  option_key: string;
  body: string;
  is_correct: boolean;
  order_index: number;
};

export type CourseVideoContent = {
  media_file_id: string;
  media_url?: string;
};

export type CourseTextContent = {
  content_delta: string;
};

export type CourseQuizContent = {
  prompt: string;
  allow_multiple: boolean;
  options: CourseQuizOption[];
};

export type CourseSubLesson = {
  id: string;
  stable_id: string;
  title: string;
  kind: CourseSubLessonKind;
  is_preview: boolean;
  order_index: number;
  row_version: number;
  estimated_duration_ms?: number;
  video?: CourseVideoContent;
  text?: CourseTextContent;
  quiz?: CourseQuizContent;
};

export type CourseLesson = {
  id: string;
  stable_id: string;
  title: string;
  summary: string;
  order_index: number;
  row_version: number;
  estimated_duration_ms?: number;
  sub_lessons: CourseSubLesson[];
};

export type CourseSection = {
  id: string;
  stable_id: string;
  title: string;
  description: string;
  order_index: number;
  row_version: number;
  estimated_duration_ms?: number;
  lessons: CourseLesson[];
};

export type CourseDetail = {
  course: Course;
  collaborator_role: CourseCollaboratorRole;
  live_version?: CourseVersion;
  draft_version?: CourseVersion;
  last_rejection_reason?: string;
  collaborators: CourseCollaborator[];
  outline: CourseSection[];
};

export type CourseLease = {
  id: string;
  course_id: string;
  course_version_id: string;
  resource_type: CourseResourceType;
  resource_stable_id: string;
  holder_user_id: string;
  lease_token: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
};

export type CourseEnrollment = {
  id: string;
  course_id: string;
  user_id: string;
  current_version_id: string;
  created_at: number;
  updated_at: number;
};

export type CourseProgressItem = {
  id: string;
  stable_content_id: string;
  content_type: string;
  status: CourseProgressStatus | string;
  score: number;
  quiz_attempt: string;
  last_interacted_at?: number;
};

export type CourseProgress = {
  enrollment: CourseEnrollment;
  items: CourseProgressItem[];
};

export type CreateCoursePayload = {
  title: string;
};

export type UpdateCourseBasicInfoPayload = {
  expected_row_version: number;
  title: string;
  short_description: string;
  about_course: string;
  thumbnail_file_id: string;
  preview_video_file_id?: string;
  course_level_id: string;
  course_topic_id: string;
  tag_ids: string[];
  skill_ids: string[];
  outcome_ids: string[];
};

export type UpsertCourseSectionPayload = {
  expected_row_version?: number;
  title: string;
  description: string;
};

export type UpsertCourseLessonPayload = {
  section_id: string;
  expected_row_version?: number;
  title: string;
  summary: string;
};

export type UpsertCourseQuizOptionPayload = {
  option_key: string;
  body: string;
  is_correct: boolean;
};

export type UpsertCourseSubLessonPayload = {
  lesson_id: string;
  expected_row_version?: number;
  title: string;
  kind: CourseSubLessonKind;
  is_preview: boolean;
  estimated_duration_ms?: number;
  video?: CourseVideoContent;
  text?: CourseTextContent;
  quiz?: {
    prompt: string;
    allow_multiple: boolean;
    options: UpsertCourseQuizOptionPayload[];
  };
};

export type ReorderCoursePayload = {
  ordered_stable_ids: string[];
};

export type AcquireCourseLeasePayload = {
  course_version_id: string;
  resource_type: CourseResourceType;
  resource_stable_id: string;
};

export type ReleaseCourseLeasePayload = {
  lease_token: string;
};

export type RejectCourseDraftPayload = {
  reason: string;
};

export type ApproveCourseDraftPayload = {
  approval_note: string;
};

export type CourseReviewHistoryStatus = "APPROVED" | "REJECTED";

export type CourseReviewHistoryItem = {
  version_no: number;
  status: CourseReviewHistoryStatus;
  note: string;
  reviewed_at: number;
};

export type CourseCollaboratorListFilters = ApiListQueryParams;

export type CourseInstructorCandidate = UserPickerCandidate;

export type CourseInstructorCandidateFilters = ApiListQueryParams;

export type CourseReviewHistoryFilters = {
  page?: number;
  per_page?: number;
  status?: CourseReviewHistoryStatus | "";
};

export type CourseEditorTab =
  | "info"
  | "outline"
  | "collaborators"
  | "pricing"
  | "certificate"
  | "review-history";

export type CourseSelectionKey = "tag_ids" | "skill_ids" | "outcome_ids";

export type CourseBasicInfoForm = {
  title: string;
  short_description: string;
  about_course: string;
  thumbnail_file_id: string;
  thumbnail_url: string;
  preview_video_file_id: string;
  preview_video_url: string;
  course_level_id: string;
  course_topic_id: string;
  tag_ids: string[];
  skill_ids: string[];
  outcome_ids: string[];
  expected_row_version: number;
};

export type CourseOutlineItemKind = "section" | "lesson" | "item";

export type CourseOutlineItemFormBase = {
  title: string;
  expected_row_version: number;
};

export type CourseSectionFormState = CourseOutlineItemFormBase & {
  description: string;
};

export type CourseLessonFormState = CourseOutlineItemFormBase & {
  section_id: string;
  summary: string;
};

export type CourseSubLessonFormState = {
  lesson_id: string;
  title: string;
  kind: CourseSubLessonKind;
  is_preview: boolean;
  expected_row_version: number;
  duration_hours: number;
  duration_minutes: number;
  duration_seconds: number;
  video_file_id: string;
  video_url: string;
  video_duration_seconds: number;
  text_delta: string;
  quiz_prompt: string;
  allow_multiple: boolean;
  quiz_options: UpsertCourseQuizOptionPayload[];
};

export type CourseOutlineItemDialogMode = {
  mode: "create" | "edit";
};

export type CourseSectionDialogState = CourseOutlineItemDialogMode & {
  section?: CourseSection;
};

export type CourseLessonDialogState = CourseOutlineItemDialogMode & {
  section: CourseSection;
  lesson?: CourseLesson;
};

export type CourseSubLessonDialogState = {
  mode: "create" | "edit";
  lesson: CourseLesson;
  subLesson?: CourseSubLesson;
};
