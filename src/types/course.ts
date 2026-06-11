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
  created_at: number;
  updated_at: number;
};

export type CourseListItem = Course & {
  title: string;
  review_status: CourseVersionStatus | "";
  version_no: number;
  collaborator_role: CourseCollaboratorRole;
  has_published: boolean;
  has_draft: boolean;
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  preview_video_file_id?: string;
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
  sub_lessons: CourseSubLesson[];
};

export type CourseSection = {
  id: string;
  stable_id: string;
  title: string;
  description: string;
  order_index: number;
  row_version: number;
  lessons: CourseLesson[];
};

export type CourseDetail = {
  course: Course;
  collaborator_role: CourseCollaboratorRole;
  live_version?: CourseVersion;
  draft_version?: CourseVersion;
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

export type CourseEditorTab =
  | "info"
  | "outline"
  | "collaborators"
  | "pricing"
  | "certificate";

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

export type CourseSectionFormState = {
  title: string;
  description: string;
  expected_row_version: number;
};

export type CourseLessonFormState = {
  section_id: string;
  title: string;
  summary: string;
  expected_row_version: number;
};

export type CourseSubLessonFormState = {
  lesson_id: string;
  title: string;
  kind: CourseSubLessonKind;
  is_preview: boolean;
  expected_row_version: number;
  video_file_id: string;
  video_url: string;
  text_delta: string;
  quiz_prompt: string;
  allow_multiple: boolean;
  quiz_options: UpsertCourseQuizOptionPayload[];
};

export type CourseSectionDialogState = {
  mode: "create" | "edit";
  section?: CourseSection;
};

export type CourseLessonDialogState = {
  mode: "create" | "edit";
  section: CourseSection;
  lesson?: CourseLesson;
};

export type CourseSubLessonDialogState = {
  mode: "create" | "edit";
  lesson: CourseLesson;
  subLesson?: CourseSubLesson;
};
