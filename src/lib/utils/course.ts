import { createEmptyDeltaString } from "@/lib/utils/course-delta";
import type {
  CourseBasicInfoForm,
  CourseSubLesson,
  CourseSubLessonFormState,
  CourseVersion,
} from "@/types/course";

export function createCourseBasicInfoState(
  activeVersion?: CourseVersion,
): CourseBasicInfoForm {
  return {
    title: activeVersion?.title ?? "",
    short_description: activeVersion?.short_description ?? "",
    about_course: activeVersion?.about_course ?? "",
    thumbnail_file_id: activeVersion?.thumbnail_file_id ?? "",
    thumbnail_url: activeVersion?.thumbnail_url ?? "",
    preview_video_file_id: activeVersion?.preview_video_file_id ?? "",
    preview_video_url: activeVersion?.preview_video_url ?? "",
    course_level_id: activeVersion?.course_level_id
      ? String(activeVersion.course_level_id)
      : "",
    course_topic_id: activeVersion?.course_topic_id
      ? String(activeVersion.course_topic_id)
      : "",
    tag_ids: activeVersion?.tag_ids ?? [],
    skill_ids: activeVersion?.skill_ids ?? [],
    outcome_ids: activeVersion?.outcome_ids ?? [],
    expected_row_version: activeVersion?.row_version ?? 0,
  };
}

function createEmptyQuizOption() {
  return {
    option_key: crypto.randomUUID(),
    body: "",
    is_correct: false,
  };
}

export function createCourseSubLessonFormState(
  lessonId = 0,
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

export function selectedIdsToMap(ids: number[]) {
  return new Set(ids);
}

export function rootOutlineStableId(courseId: number): string {
  return `course-${courseId}-outline-root`;
}
