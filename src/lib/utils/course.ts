import { createEmptyDeltaString } from "@/lib/utils/course-delta";
import { newV7 } from "@/lib/utils/uuid";
import type {
  CourseBasicInfoForm,
  CourseEditorTab,
  CourseSubLesson,
  CourseSubLessonFormState,
  CourseVersion,
  UpdateCourseBasicInfoPayload,
} from "@/types/course";

export const courseEditorTabs = [
  "info",
  "outline",
  "collaborators",
  "pricing",
  "certificate",
] as const satisfies ReadonlyArray<CourseEditorTab>;

export function createCourseBasicInfoState(
  activeVersion?: CourseVersion,
): CourseBasicInfoForm {
  return {
    title: activeVersion?.title ?? "",
    short_description: activeVersion?.short_description ?? "",
    about_course: activeVersion?.about_course ?? createEmptyDeltaString(),
    thumbnail_file_id: activeVersion?.thumbnail_file_id ?? "",
    thumbnail_url: activeVersion?.thumbnail_url ?? "",
    preview_video_file_id: activeVersion?.preview_video_file_id ?? "",
    preview_video_url: activeVersion?.preview_video_url ?? "",
    course_level_id: activeVersion?.course_level_id ?? "",
    course_topic_id: activeVersion?.course_topic_id ?? "",
    tag_ids: activeVersion?.tag_ids ?? [],
    skill_ids: activeVersion?.skill_ids ?? [],
    outcome_ids: activeVersion?.outcome_ids ?? [],
    expected_row_version: activeVersion?.row_version ?? 0,
  };
}

export function toUpdateCourseBasicInfoPayload(
  basicInfo: CourseBasicInfoForm,
): UpdateCourseBasicInfoPayload {
  const payload: UpdateCourseBasicInfoPayload = {
    expected_row_version: basicInfo.expected_row_version,
    title: basicInfo.title.trim(),
    short_description: basicInfo.short_description.trim(),
    about_course: basicInfo.about_course.trim(),
    thumbnail_file_id: basicInfo.thumbnail_file_id,
    course_level_id: basicInfo.course_level_id,
    course_topic_id: basicInfo.course_topic_id,
    tag_ids: basicInfo.tag_ids,
    skill_ids: basicInfo.skill_ids,
    outcome_ids: basicInfo.outcome_ids,
  };
  if (basicInfo.preview_video_file_id) {
    payload.preview_video_file_id = basicInfo.preview_video_file_id;
  }
  return payload;
}

function createEmptyQuizOption() {
  return {
    option_key: newV7(),
    body: "",
    is_correct: false,
  };
}

export function createCourseSubLessonFormState(
  lessonId = "",
  subLesson?: CourseSubLesson,
): CourseSubLessonFormState {
  return {
    lesson_id: lessonId,
    title: subLesson?.title ?? "",
    kind: subLesson?.kind ?? "VIDEO",
    is_preview: subLesson?.is_preview ?? false,
    expected_row_version: subLesson?.row_version ?? 0,
    video_file_id: subLesson?.video?.media_file_id ?? "",
    video_url: subLesson?.video?.media_url ?? "",
    text_delta: subLesson?.text?.content_delta ?? createEmptyDeltaString(),
    quiz_prompt: subLesson?.quiz?.prompt ?? "",
    allow_multiple: subLesson?.quiz?.allow_multiple ?? false,
    quiz_options: subLesson?.quiz?.options?.map((option) => ({
      option_key: option.option_key,
      body: option.body,
      is_correct: option.is_correct,
    })) ?? [createEmptyQuizOption()],
  };
}

export function selectedIdsToMap(ids: string[]) {
  return new Set(ids);
}

/** OUTLINE_ROOT lease key — course id is already a UUID v7 from BE. */
export function rootOutlineStableId(courseId: string): string {
  return courseId;
}
