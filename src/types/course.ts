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
  id: number;
  owner_user_id: number;
  slug: string;
  current_published_version_id?: number;
  current_draft_version_id?: number;
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
  id: number;
  course_id: number;
  version_no: number;
  status: CourseVersionStatus;
  based_on_version_id?: number;
  title: string;
  short_description: string;
  about_course: string;
  thumbnail_file_id?: string;
  thumbnail_url?: string;
  preview_video_file_id?: string;
  preview_video_url?: string;
  course_level_id?: number;
  course_topic_id?: number;
  tag_ids: number[];
  skill_ids: number[];
  outcome_ids: number[];
  row_version: number;
  submitted_by_user_id?: number;
  submitted_at?: number;
  approved_by_user_id?: number;
  approved_at?: number;
  rejected_by_user_id?: number;
  rejected_at?: number;
  rejection_reason: string;
  created_at: number;
  updated_at: number;
};

export type CourseCollaborator = {
  user_id: number;
  role: CourseCollaboratorRole;
  display_name: string;
  email: string;
  avatar_file_id?: string;
  avatar_url?: string;
};

export type CourseQuizOption = {
  id: number;
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
  id: number;
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
  id: number;
  stable_id: string;
  title: string;
  summary: string;
  order_index: number;
  row_version: number;
  sub_lessons: CourseSubLesson[];
};

export type CourseSection = {
  id: number;
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
  id: number;
  course_id: number;
  course_version_id: number;
  resource_type: CourseResourceType;
  resource_stable_id: string;
  holder_user_id: number;
  lease_token: string;
  expires_at: number;
  created_at: number;
  updated_at: number;
};

export type CourseEnrollment = {
  id: number;
  course_id: number;
  user_id: number;
  current_version_id: number;
  created_at: number;
  updated_at: number;
};

export type CourseProgressItem = {
  id: number;
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
  title?: string;
  short_description?: string;
  about_course?: string;
  thumbnail_file_id?: string;
  preview_video_file_id?: string;
  course_level_id?: number;
  course_topic_id?: number;
  tag_ids?: number[];
  skill_ids?: number[];
  outcome_ids?: number[];
};

export type UpsertCourseSectionPayload = {
  expected_row_version?: number;
  title: string;
  description: string;
};

export type UpsertCourseLessonPayload = {
  section_id: number;
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
  lesson_id: number;
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
  course_version_id: number;
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
  tag_ids: number[];
  skill_ids: number[];
  outcome_ids: number[];
  expected_row_version: number;
};

export type CourseSectionFormState = {
  title: string;
  description: string;
  expected_row_version: number;
};

export type CourseLessonFormState = {
  section_id: number;
  title: string;
  summary: string;
  expected_row_version: number;
};

export type CourseSubLessonFormState = {
  lesson_id: number;
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
